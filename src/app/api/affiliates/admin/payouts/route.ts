import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function checkAdminAuth(req: NextRequest): boolean {
  const adminCookie = req.cookies.get('admin_auth');
  return adminCookie?.value === 'authenticated';
}

function cleanPayoutRef(ref?: string): string {
  if (!ref) return '';
  const parts = ref.split('-');
  if (parts.length >= 3) {
    const prefix = parts[0] || 'PAY';
    const pCode = parts[1].slice(0, 4);
    const tail = parts[2].slice(-4);
    return `${prefix}${pCode}${tail}`.toUpperCase();
  }
  return ref.replace(/-/g, '').toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: payouts, error } = await supabase
      .from('affiliate_payouts')
      .select('*, affiliate_partners(first_name, last_name, business_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    const sanitized = (payouts || []).map((p: any) => ({
      ...p,
      payout_reference: cleanPayoutRef(p.payout_reference),
    }));

    return NextResponse.json({ success: true, payouts: sanitized });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      partner_id,
      amount,
      currency = 'IDR',
      payout_method = 'bank_transfer',
      payout_details = {},
      proof_document_url = '',
      notes = '',
      commission_ids = [],
      payout_date = '',
      payment_reference = '',
      payout_reference = '',
    } = body;

    if (!partner_id || !amount) {
      return NextResponse.json({ success: false, message: 'Partner ID and amount required' }, { status: 400 });
    }

    // Get partner info
    const { data: partner, error: partnerErr } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code')
      .eq('id', partner_id)
      .single();

    if (partnerErr || !partner) {
      return NextResponse.json({ success: false, message: 'Partner not found' }, { status: 404 });
    }

    // Prefer custom reference if supplied, otherwise generate short clean reference
    const customRef = (payout_reference || payment_reference || '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const pCode = (partner.partner_code || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const payoutReference = customRef || `PAY${pCode || 'REF'}${rand}`;

    // 1. Determine ISO date for payout record
    let targetDateIso = new Date().toISOString();
    if (payout_date) {
      try {
        const d = new Date(payout_date);
        if (!isNaN(d.getTime())) {
          targetDateIso = d.toISOString();
        }
      } catch (e) {
        // fallback
      }
    }

    const mergedDetails = {
      ...payout_details,
      settlement_date: payout_date || targetDateIso.split('T')[0],
      payout_date: payout_date || targetDateIso.split('T')[0],
      payment_reference: payoutReference,
      payout_reference: payoutReference,
      approved_at: targetDateIso,
      approved_by: 'admin',
      paid_at: targetDateIso,
    };

    const finalNotes = notes || `Settlement: ${payout_date || targetDateIso.split('T')[0]}`;

    // Desired insert payload with additive specification fields
    const candidatePayload: Record<string, any> = {
      partner_id: partner.id,
      partner_code: partner.partner_code,
      payout_reference: payoutReference,
      payment_reference: payoutReference,
      payment_method: payout_method,
      amount: Number(amount),
      currency,
      status: 'completed',
      payout_details: mergedDetails,
      proof_document_url: proof_document_url || null,
      notes: finalNotes,
      processed_at: targetDateIso,
      paid_at: targetDateIso,
      created_at: targetDateIso,
      approved_at: targetDateIso,
      approved_by: 'admin',
    };

    let newPayout: any = null;
    let payoutErr: any = null;

    // Resilient adaptive insert: dynamically handles missing columns in live Supabase schema cache
    const activePayload = { ...candidatePayload };
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .insert([activePayload])
        .select('*')
        .single();

      if (!error && data) {
        newPayout = data;
        payoutErr = null;
        break;
      }

      payoutErr = error;
      const errMsg = error?.message || '';
      const match = errMsg.match(/Could not find the '([^']+)' column of 'affiliate_payouts'/i);
      if (match && match[1] && activePayload[match[1]] !== undefined) {
        delete activePayload[match[1]];
        continue;
      }
      break;
    }

    if (payoutErr || !newPayout) {
      return NextResponse.json({ 
        success: false, 
        message: payoutErr?.message || 'Payout creation failed' 
      }, { status: 400 });
    }

    if (newPayout) {
      newPayout.payment_reference = newPayout.payment_reference || payoutReference;
      newPayout.paid_at = newPayout.paid_at || targetDateIso;
      newPayout.approved_at = newPayout.approved_at || targetDateIso;
    }

    // 2. Select eligible commissions for this partner, strictly preventing double-payout
    // RULE: Settle commissions explicitly selected, or approved/completed unsettled commissions
    let commsToMark: { id: string; commission_amount: number }[] = [];
    if (Array.isArray(commission_ids) && commission_ids.length > 0) {
      const { data: validComms } = await supabase
        .from('affiliate_commissions')
        .select('id, commission_amount, status, payout_id')
        .in('id', commission_ids)
        .in('status', ['approved', 'pending'])
        .is('payout_id', null);

      if (validComms) {
        commsToMark = validComms;
      }
    } else {
      const { data: eligibleComms } = await supabase
        .from('affiliate_commissions')
        .select('id, commission_amount, status, payout_id')
        .or(`partner_id.eq.${partner.id},partner_code.eq.${partner.partner_code}`)
        .in('status', ['approved', 'pending'])
        .is('payout_id', null);

      if (eligibleComms && eligibleComms.length > 0) {
        commsToMark = eligibleComms;
      }
    }

    if (commsToMark.length > 0) {
      const commIds = commsToMark.map((c) => c.id);

      // Atomically mark commissions as paid and completed
      const { error: commUpdateErr } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          service_completed: true,
          payment_verified: true,
          paid_at: targetDateIso,
          payout_id: newPayout.id,
          updated_at: targetDateIso,
        })
        .in('id', commIds);

      if (commUpdateErr) {
        // Fallback update if extended columns are not present
        await supabase
          .from('affiliate_commissions')
          .update({
            status: 'paid',
            service_completed: true,
            payment_verified: true,
            paid_at: targetDateIso,
          })
          .in('id', commIds);
      }

      // Record items in partner_payout_items to trace exact link and prevent double payout
      try {
        const payoutItems = commsToMark.map((c) => ({
          payout_id: newPayout.id,
          commission_id: c.id,
          amount: Number(c.commission_amount || 0),
        }));

        await supabase.from('partner_payout_items').insert(payoutItems);
      } catch (itemErr) {
        // Non-fatal if table not yet migrated
      }
    }

    // 3. Record administrative audit log
    try {
      await supabase.from('partner_audit_logs').insert([
        {
          actor_id: 'admin',
          actor_type: 'admin',
          action: 'payout_recorded',
          target_type: 'payout',
          target_id: newPayout.id,
          metadata: {
            partner_id: partner.id,
            partner_code: partner.partner_code,
            amount: Number(amount),
            currency,
            payout_reference: payoutReference,
            commission_count: commsToMark.length,
            payout_method,
          },
        },
      ]);
    } catch (auditErr) {
      // Non-fatal
    }

    return NextResponse.json({ success: true, payout: newPayout, commission_count: commsToMark.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
