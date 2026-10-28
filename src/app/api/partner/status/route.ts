import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';

    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const session = await getPartnerSession();
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    const { data: partner, error } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code, first_name, last_name, business_name, email, status, commission_rate_pct, approved_at, created_at')
      .eq('id', session.id)
      .maybeSingle();

    if (error || !partner) {
      return NextResponse.json({ success: false, message: 'Partner record not found' }, { status: 404 });
    }

    const isApproved = partner.status === 'active' || partner.status === 'approved';

    return NextResponse.json({
      success: true,
      authenticated: true,
      isApproved,
      status: partner.status,
      partner: {
        id: partner.id,
        partner_code: partner.partner_code,
        full_name: `${partner.first_name || ''} ${partner.last_name || ''}`.trim(),
        business_name: partner.business_name,
        email: partner.email,
        status: partner.status,
        commission_rate_pct: partner.commission_rate_pct,
        created_at: partner.created_at,
        approved_at: partner.approved_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
