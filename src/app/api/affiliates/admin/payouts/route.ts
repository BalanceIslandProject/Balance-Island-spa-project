import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function checkAdminAuth(req: NextRequest): boolean {
  const adminCookie = req.cookies.get('admin_auth');
  return adminCookie?.value === 'authenticated';
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

    return NextResponse.json({ success: true, payouts: payouts || [] });
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

    const payoutReference = `PAY-${partner.partner_code}-${Date.now().toString(36).toUpperCase()}`;

    // 1. Insert payout record
    const { data: newPayout, error: payoutErr } = await supabase
      .from('affiliate_payouts')
      .insert([
        {
          partner_id: partner.id,
          partner_code: partner.partner_code,
          payout_reference: payoutReference,
          amount: Number(amount),
          currency,
          status: 'completed',
          payout_method,
          payout_details,
          proof_document_url,
          notes,
          processed_at: new Date().toISOString(),
        },
      ])
      .select('*')
      .single();

    if (payoutErr || !newPayout) {
      return NextResponse.json({ success: false, message: payoutErr?.message || 'Payout creation failed' }, { status: 400 });
    }

    // 2. Mark specific selected commissions (or all approved) for this partner as 'paid'
    let commIdsToMark: string[] = [];
    if (Array.isArray(commission_ids) && commission_ids.length > 0) {
      commIdsToMark = commission_ids;
    } else {
      const { data: approvedComms } = await supabase
        .from('affiliate_commissions')
        .select('id, commission_amount')
        .eq('partner_id', partner.id)
        .eq('status', 'approved');

      if (approvedComms && approvedComms.length > 0) {
        commIdsToMark = approvedComms.map((c) => c.id);
      }
    }

    if (commIdsToMark.length > 0) {
      await supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_id: newPayout.id,
          updated_at: new Date().toISOString(),
        })
        .in('id', commIdsToMark);
    }

    return NextResponse.json({ success: true, payout: newPayout });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
