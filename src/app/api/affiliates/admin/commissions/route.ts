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
      .from('affiliate_commissions')
      .select('*, affiliate_partners(first_name, last_name, business_name, email)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: commissions, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, commissions: commissions || [] });
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
    const { id, status, payment_verified, service_completed, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Commission ID required' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updates.status = status;
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
      }
    }
    if (payment_verified !== undefined) updates.payment_verified = Boolean(payment_verified);
    if (service_completed !== undefined) updates.service_completed = Boolean(service_completed);
    if (notes !== undefined) updates.notes = notes;

    const { data: updated, error } = await supabase
      .from('affiliate_commissions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, commission: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
