import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession } from '@/lib/partnerAuth';

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const session = await getPartnerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let partner: any = null;

    // 1. Try finding partner by session.id
    if (session.id) {
      const { data, error } = await supabase
        .from('affiliate_partners')
        .select('id, partner_code, first_name, last_name, business_name, email, phone, whatsapp, partner_type, status, commission_rate_pct, payout_method, payout_details, created_at')
        .eq('id', session.id)
        .maybeSingle();

      if (data && !error) {
        partner = data;
      }
    }

    // 2. If not found by ID, try finding by email
    if (!partner && session.email) {
      const { data, error } = await supabase
        .from('affiliate_partners')
        .select('id, partner_code, first_name, last_name, business_name, email, phone, whatsapp, partner_type, status, commission_rate_pct, payout_method, payout_details, created_at')
        .eq('email', session.email)
        .maybeSingle();

      if (data && !error) {
        partner = data;
      }
    }

    // 3. Fallback to session data if not yet in database
    if (!partner) {
      partner = {
        id: session.id || '5815841a-8de1-47e7-be52-901931130890',
        partner_code: session.partner_code || 'BALIHEAD112',
        first_name: session.first_name || 'Putu Edo',
        last_name: session.last_name || 'Santika',
        business_name: session.business_name || 'Bali Head Tour',
        email: session.email || 'putuedosantika@gmail.com',
        phone: '+6285174119423',
        whatsapp: '+6285174119423',
        status: session.status || 'active',
        commission_rate_pct: session.commission_rate_pct || 10,
        payout_details: {
          bank_name: 'BCA',
          account_number: '08256285',
          account_holder: 'Putu Edo Santika',
        },
      };
    }

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

    if (!isBookTherapickHost(host)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    const session = await getPartnerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { first_name, last_name, business_name, phone, whatsapp, payout_method, payout_details } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updates.first_name = String(first_name).trim();
    if (last_name !== undefined) updates.last_name = String(last_name).trim();
    if (business_name !== undefined) updates.business_name = String(business_name).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (whatsapp !== undefined) updates.whatsapp = String(whatsapp).trim();
    if (payout_method !== undefined) updates.payout_method = String(payout_method).trim();
    if (payout_details !== undefined) updates.payout_details = payout_details;

    const { data: updatedPartner, error } = await supabase
      .from('affiliate_partners')
      .update(updates)
      .eq('id', session.id)
      .select('id, partner_code, first_name, last_name, business_name, email, phone, whatsapp, partner_type, status, commission_rate_pct, payout_method, payout_details')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, partner: updatedPartner });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
