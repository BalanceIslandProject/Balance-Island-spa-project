import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { verifyPassword, createSessionToken } from '@/lib/partnerAuth';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

    // Strictly BookTherapick only
    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: partner, error } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code, first_name, last_name, business_name, email, password_hash, status, commission_rate_pct')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !partner) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, partner.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (partner.status === 'pending') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Your partner account is pending admin approval. You will be able to log in once an administrator approves your account.' 
        },
        { status: 403 }
      );
    }

    if (partner.status === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Your partner account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (partner.status === 'rejected') {
      return NextResponse.json(
        { success: false, message: 'Your application was not approved. Please contact support for more details.' },
        { status: 403 }
      );
    }

    // Generate session token
    const token = createSessionToken({
      id: partner.id,
      partner_code: partner.partner_code,
      email: partner.email,
      first_name: partner.first_name,
      business_name: partner.business_name,
      status: partner.status,
      created_at: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        partner_code: partner.partner_code,
        first_name: partner.first_name,
        last_name: partner.last_name,
        business_name: partner.business_name,
        email: partner.email,
        status: partner.status,
        commission_rate_pct: partner.commission_rate_pct,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const isTherapickDomain = host.includes('booktherapick.com');

    response.cookies.set('partner_session', token, {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: isProd && isTherapickDomain ? '.booktherapick.com' : undefined,
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return response;
  } catch (err: any) {
    console.error('Partner login error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
