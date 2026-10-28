import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { hashPassword, createSessionToken } from '@/lib/partnerAuth';

// Helper to sanitize partner code
function formatPartnerCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20);
}

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

    // Reject non-BookTherapick requests
    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const body = await req.json();
    const {
      first_name,
      last_name = '',
      business_name = '',
      email,
      phone = '',
      whatsapp = '',
      partner_type = 'content_creator',
      custom_code = '',
      password,
      payout_method = 'bank_transfer',
      payout_details = {},
    } = body;

    if (!first_name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'First name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const { data: existingUser } = await supabase
      .from('affiliate_partners')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Determine partner code
    let proposedCode = custom_code ? formatPartnerCode(custom_code) : '';
    if (!proposedCode || proposedCode.length < 3) {
      const base = (business_name || first_name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      proposedCode = `${base || 'PARTNER'}${randomSuffix}`;
    }

    // Ensure uniqueness of partner code
    let finalCode = proposedCode;
    let attempts = 0;
    while (attempts < 5) {
      const { data: existingCode } = await supabase
        .from('affiliate_partners')
        .select('id')
        .eq('partner_code', finalCode)
        .maybeSingle();

      if (!existingCode) break;
      attempts++;
      finalCode = `${proposedCode}${Math.floor(10 + Math.random() * 90)}`;
    }

    // Check program settings for auto-approval & default commission
    const { data: settings } = await supabase
      .from('affiliate_program_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const commissionRate = settings?.default_commission_rate_pct ? Number(settings.default_commission_rate_pct) : 15.00;
    // Newly registered partners require admin approval before they can log in
    const initialStatus = 'pending';

    const passwordHash = hashPassword(password);

    const { data: newPartner, error: insertError } = await supabase
      .from('affiliate_partners')
      .insert([
        {
          partner_code: finalCode,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          business_name: business_name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          partner_type,
          status: initialStatus,
          commission_rate_pct: commissionRate,
          password_hash: passwordHash,
          payout_method,
          payout_details,
        },
      ])
      .select('id, partner_code, first_name, last_name, business_name, email, status, commission_rate_pct')
      .single();

    if (insertError || !newPartner) {
      console.error('Failed to create partner account:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create partner account. Please try again.' },
        { status: 500 }
      );
    }

    // Do NOT auto-login. The partner must wait for admin approval.
    return NextResponse.json({
      success: true,
      pendingApproval: true,
      partner: {
        id: newPartner.id,
        partner_code: newPartner.partner_code,
        first_name: newPartner.first_name,
        email: newPartner.email,
        status: newPartner.status,
      },
      message: 'Your registration has been submitted and is pending admin approval. You will be able to log in once your application is reviewed and approved by an administrator.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
