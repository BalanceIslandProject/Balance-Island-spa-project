import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';

    // Strictly BookTherapick only
    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const body = await req.json();
    const { partnerCode, landingPath = '/', referrer = '' } = body;

    if (!partnerCode || typeof partnerCode !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid partner code' }, { status: 400 });
    }

    const normalizedCode = partnerCode.toUpperCase().trim();

    // Verify partner is active
    const { data: partner, error: partnerErr } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code, status')
      .eq('partner_code', normalizedCode)
      .eq('status', 'active')
      .single();

    if (partnerErr || !partner) {
      return NextResponse.json({ success: false, message: 'Partner not active' }, { status: 404 });
    }

    // Hash client IP for privacy compliance
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
    const userAgent = req.headers.get('user-agent') || '';

    // Record click asynchronously
    await supabase.from('affiliate_clicks').insert([
      {
        partner_id: partner.id,
        partner_code: partner.partner_code,
        visitor_ip_hash: ipHash,
        user_agent: userAgent.substring(0, 255),
        referrer_url: String(referrer).substring(0, 500),
        landing_path: String(landingPath).substring(0, 255),
      },
    ]);

    return NextResponse.json({
      success: true,
      partner_id: partner.id,
      partner_code: partner.partner_code,
    });
  } catch (err: any) {
    console.error('Error handling affiliate click:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
