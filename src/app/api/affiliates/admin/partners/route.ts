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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('affiliate_partners')
      .select('id, partner_code, first_name, last_name, business_name, email, phone, whatsapp, partner_type, status, commission_rate_pct, payout_method, payout_details, notes, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: partners, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, partners: partners || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, commission_rate_pct, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Partner ID required' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updates.status = status;
    if (commission_rate_pct !== undefined) updates.commission_rate_pct = Number(commission_rate_pct);
    if (notes !== undefined) updates.notes = notes;

    const { data: updated, error } = await supabase
      .from('affiliate_partners')
      .update(updates)
      .eq('id', id)
      .select('id, partner_code, first_name, last_name, business_name, email, phone, whatsapp, partner_type, status, commission_rate_pct, notes')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, partner: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
