import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { hashPassword, createSessionToken } from '@/lib/partnerAuth';

// Partner type mapping
export const VALID_PARTNER_TYPES = [
  'travel_agency',
  'tour_guide',
  'private_driver',
  'villa_concierge',
  'hotel_partner',
  'other_partner',
] as const;

function generateReferralCode(businessOrName: string): string {
  const clean = businessOrName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  const prefix = clean.length >= 3 ? clean : 'THERAPICK';
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';

    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const body = await req.json();
    const {
      full_name,
      email,
      business_name,
      partner_type = 'villa_concierge',
      whatsapp_number,
      operating_region = 'Bali, Indonesia',
      business_website = '',
      notes = '',
      password = '',
      clerk_user_id = '',
    } = body;

    // Validation
    if (!full_name || !email || !business_name || !whatsapp_number) {
      return NextResponse.json(
        { success: false, message: 'Full name, email, business name, and WhatsApp number are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const parts = full_name.trim().split(' ');
    const firstName = parts[0] || 'Partner';
    const lastName = parts.slice(1).join(' ') || '';

    // Check if partner already exists
    const { data: existing } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code, status, clerk_user_id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      // If already existing and clerk_user_id was provided, link it
      if (clerk_user_id && !existing.clerk_user_id) {
        await supabase
          .from('affiliate_partners')
          .update({ clerk_user_id, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      }

      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        status: existing.status,
        partner_code: existing.partner_code,
        message: 'Your partner application is already on file.',
      });
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(business_name || firstName);
    let attempts = 0;
    while (attempts < 5) {
      const { data: codeCheck } = await supabase
        .from('affiliate_partners')
        .select('id')
        .eq('partner_code', referralCode)
        .maybeSingle();

      if (!codeCheck) break;
      attempts++;
      referralCode = generateReferralCode(business_name || firstName);
    }

    // Hash fallback password if provided
    const passwordHash = password ? hashPassword(password) : hashPassword(`Temp-${Date.now()}`);

    const partnerPayload: any = {
      partner_code: referralCode,
      first_name: firstName,
      last_name: lastName,
      business_name: business_name.trim(),
      email: cleanEmail,
      phone: whatsapp_number.trim(),
      whatsapp: whatsapp_number.trim(),
      partner_type,
      status: 'pending', // Strictly pending admin approval
      commission_rate_pct: 15.00, // 15% default
      password_hash: passwordHash,
      notes: [
        `Operating Region: ${operating_region || 'Bali'}`,
        business_website ? `Website: ${business_website}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join(' | '),
    };

    if (clerk_user_id) {
      partnerPayload.clerk_user_id = clerk_user_id;
    }

    const { data: newPartner, error: insertError } = await supabase
      .from('affiliate_partners')
      .insert([partnerPayload])
      .select('id, partner_code, first_name, last_name, business_name, email, status, commission_rate_pct, created_at')
      .single();

    if (insertError || !newPartner) {
      console.error('Failed to insert partner application:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // Also populate partner_referrals table
    try {
      await supabase.from('partner_referrals').insert([
        {
          partner_id: newPartner.id,
          referral_code: newPartner.partner_code,
          is_active: false, // inactive until partner is approved
        },
      ]);
    } catch (refErr) {
      // Non-fatal if table not migrated yet
    }

    // Record audit log
    try {
      await supabase.from('partner_audit_logs').insert([
        {
          actor_id: newPartner.id,
          actor_type: 'partner',
          action: 'application_submitted',
          target_type: 'partner',
          target_id: newPartner.id,
          metadata: {
            business_name,
            partner_type,
            operating_region,
            email: cleanEmail,
          },
        },
      ]);
    } catch (auditErr) {
      // Non-fatal
    }

    // Create session token so applicant can view pending-approval status
    const sessionToken = createSessionToken({
      id: newPartner.id,
      partner_code: newPartner.partner_code,
      email: newPartner.email,
      first_name: newPartner.first_name,
      business_name: newPartner.business_name,
      status: 'pending',
      created_at: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      partner: newPartner,
      redirect: '/pending-approval',
      message: 'Application submitted successfully. Awaiting administrator review.',
    });

    const isProd = process.env.NODE_ENV === 'production';
    const isTherapickDomain = host.includes('booktherapick.com');

    response.cookies.set('partner_session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: isProd && isTherapickDomain ? '.booktherapick.com' : undefined,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Onboarding submission error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
