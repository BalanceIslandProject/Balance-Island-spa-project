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

    // Short payment reference without hyphens (e.g. PAY + 4 chars from partner code + 4 random uppercase chars)
    const pCode = (partner.partner_code || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const payoutReference = `PAY${pCode || 'REF'}${rand}`;

    // 1. Insert payout record with additive specification fields
    const nowIso = new Date().toISOString();
    const { data: newPayout, error: payoutErr } = await supabase
      .from('affiliate_payouts')
      .insert([
        {
          partner_id: partner.id,
          partner_code: partner.partner_code,
          payout_reference: payoutReference,
          payment_reference: payoutReference,
          payment_method: payout_method,
          amount: Number(amount),
          currency,
          status: 'completed',
          payout_method,
          payout_details,
          proof_document_url,
          notes,
          processed_at: nowIso,
          paid_at: nowIso,
          approved_at: nowIso,
          approved_by: 'admin',
        },
      ])
      .select('*')
      .single();

    if (payoutErr || !newPayout) {
      return NextResponse.json({ success: false, message: payoutErr?.message || 'Payout creation failed' }, { status: 400 });
    }

    // 2. Select eligible commissions for this partner, strictly preventing double-payout
    let commsToMark: { id: string; commission_amount: number }[] = [];
    if (Array.isArray(commission_ids) && commission_ids.length > 0) {
      // Fetch only those that are NOT already paid
      const { data: validComms } = await supabase
        .from('affiliate_commissions')
        .select('id, commission_amount')
        .eq('partner_id', partner.id)
        .in('id', commission_ids)
        .neq('status', 'paid');

      if (validComms) {
        commsToMark = validComms;
      }
    } else {
      const { data: approvedComms } = await supabase
        .from('affiliate_commissions')
        .select('id, commission_amount')
        .eq('partner_id', partner.id)
        .eq('status', 'approved');

      if (approvedComms && approvedComms.length > 0) {
        commsToMark = approvedComms;
      }
    }

    if (commsToMark.length > 0) {
      const commIds = commsToMark.map((c) => c.id);

      // Atomically mark commissions as paid
      await supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: nowIso,
          payout_id: newPayout.id,
          updated_at: nowIso,
        })
        .in('id', commIds);

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
