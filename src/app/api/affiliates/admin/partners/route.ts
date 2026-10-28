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

    const nowIso = new Date().toISOString();
    const updates: any = {
      updated_at: nowIso,
    };

    if (status !== undefined) {
      updates.status = status;
      if (status === 'active' || status === 'approved') {
        updates.approved_at = nowIso;
        updates.approved_by = 'admin';
      }
    }
    if (commission_rate_pct !== undefined) updates.commission_rate_pct = Number(commission_rate_pct);
    if (notes !== undefined) updates.notes = notes;

    const { data: updated, error } = await supabase
      .from('affiliate_partners')
      .update(updates)
      .eq('id', id)
      .select('id, partner_code, first_name, last_name, business_name, email, phone, whatsapp, partner_type, status, commission_rate_pct, notes, approved_at, approved_by')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    // Sync partner_referrals status if table exists
    if (status !== undefined) {
      const isRefActive = status === 'active' || status === 'approved';
      try {
        await supabase
          .from('partner_referrals')
          .update({ is_active: isRefActive, ...(isRefActive ? {} : { deactivated_at: nowIso }) })
          .eq('partner_id', id);
      } catch (refErr) {
        // Non-fatal
      }
    }

    // Record audit log
    try {
      await supabase.from('partner_audit_logs').insert([
        {
          actor_id: 'admin',
          actor_type: 'admin',
          action: status ? `partner_${status}` : 'partner_rate_adjusted',
          target_type: 'partner',
          target_id: id,
          metadata: {
            status,
            commission_rate_pct,
            notes,
            partner_code: updated?.partner_code,
          },
        },
      ]);
    } catch (auditErr) {
      // Non-fatal
    }

    return NextResponse.json({ success: true, partner: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Partner ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('affiliate_partners')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Partner removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
