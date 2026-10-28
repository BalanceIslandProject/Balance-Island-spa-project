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
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { data: logs, error } = await supabase
      .from('partner_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      return NextResponse.json({ success: true, logs: [] });
    }

    return NextResponse.json({ success: true, logs: logs || [] });
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
    const { action, target_type, target_id, metadata = {}, actor_id = 'admin' } = body;

    if (!action || !target_type || !target_id) {
      return NextResponse.json({ success: false, message: 'Missing audit log fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('partner_audit_logs').insert([
      {
        actor_id,
        actor_type: 'admin',
        action,
        target_type,
        target_id,
        metadata,
      },
    ]).select('*').single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
