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

    const { data: settings } = await supabase
      .from('affiliate_program_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      settings: settings || {
        default_commission_rate_pct: 15.00,
        cookie_duration_days: 30,
        attribution_model: 'last_touch',
        auto_approve_partners: false,
        is_program_active: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      default_commission_rate_pct,
      cookie_duration_days,
      attribution_model,
      auto_approve_partners,
      is_program_active,
    } = body;

    const updates = {
      default_commission_rate_pct: Number(default_commission_rate_pct) || 15.00,
      cookie_duration_days: Number(cookie_duration_days) || 30,
      attribution_model: attribution_model || 'last_touch',
      auto_approve_partners: Boolean(auto_approve_partners),
      is_program_active: Boolean(is_program_active),
      updated_at: new Date().toISOString(),
    };

    // Check if record exists
    const { data: existing } = await supabase
      .from('affiliate_program_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabase
        .from('affiliate_program_settings')
        .update(updates)
        .eq('id', existing.id)
        .select('*')
        .single();
    } else {
      result = await supabase
        .from('affiliate_program_settings')
        .insert([updates])
        .select('*')
        .single();
    }

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, settings: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
