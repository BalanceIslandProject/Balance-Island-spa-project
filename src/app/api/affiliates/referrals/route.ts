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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: attributions, error } = await supabase
      .from('affiliate_attributions')
      .select('*')
      .eq('partner_id', session.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, referrals: attributions || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
