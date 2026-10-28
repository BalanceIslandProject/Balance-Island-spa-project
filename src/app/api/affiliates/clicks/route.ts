import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

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

    // Verify partner is active or approved
    let partnerId = '';
    let resolvedCode = normalizedCode;

    const { data: partner } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code, status')
      .eq('partner_code', normalizedCode)
      .in('status', ['active', 'approved'])
      .maybeSingle();

    if (partner) {
      partnerId = partner.id;
      resolvedCode = partner.partner_code;
    } else {
      // Check partner_referrals table if referral code was generated separately
      const { data: refRow } = await supabase
        .from('partner_referrals')
        .select('partner_id, referral_code, is_active, affiliate_partners(id, partner_code, status)')
        .eq('referral_code', normalizedCode)
        .eq('is_active', true)
        .maybeSingle();

      const linkedPartner: any = refRow?.affiliate_partners;
      if (refRow && linkedPartner && (linkedPartner.status === 'active' || linkedPartner.status === 'approved')) {
        partnerId = linkedPartner.id;
        resolvedCode = refRow.referral_code;
      }
    }

    if (!partnerId) {
      return NextResponse.json({ success: false, message: 'Partner not active' }, { status: 404 });
    }

    // Hash client IP for privacy compliance
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
    const userAgent = req.headers.get('user-agent') || '';

    // Record click asynchronously
    await supabase.from('affiliate_clicks').insert([
      {
        partner_id: partnerId,
        partner_code: resolvedCode,
        visitor_ip_hash: ipHash,
        user_agent: userAgent.substring(0, 255),
        referrer_url: String(referrer).substring(0, 500),
        landing_path: String(landingPath).substring(0, 255),
      },
    ]);

    return NextResponse.json({
      success: true,
      partner_id: partnerId,
      partner_code: resolvedCode,
    });
  } catch (err: any) {
    console.error('Error handling affiliate click:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
