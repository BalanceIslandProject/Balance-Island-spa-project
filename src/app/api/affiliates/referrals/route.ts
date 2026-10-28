import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession, isPartnerApproved } from '@/lib/partnerAuth';

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

    if (!isPartnerApproved(session)) {
      return NextResponse.json(
        { success: false, message: `Partner account is ${session.status}. Only approved partners can view referrals.` },
        { status: 403 }
      );
    }

    const [attrRes, commsRes, bookingsRes] = await Promise.all([
      supabase
        .from('affiliate_attributions')
        .select('*')
        .eq('partner_id', session.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('partner_id', session.id),
      supabase
        .from('bookings')
        .select('*'),
    ]);

    if (attrRes.error) {
      return NextResponse.json({ success: false, message: attrRes.error.message }, { status: 400 });
    }

    const attributions = attrRes.data || [];
    const commissions = commsRes.data || [];
    const bookings = bookingsRes.data || [];

    const commMap = new Map<string, any>();
    commissions.forEach((c: any) => {
      if (c.booking_id) commMap.set(String(c.booking_id).toUpperCase(), c);
    });

    const bookMap = new Map<string, any>();
    bookings.forEach((b: any) => {
      if (b.reference_number) bookMap.set(String(b.reference_number).toUpperCase(), b);
      if (b.id) bookMap.set(String(b.id).toUpperCase(), b);
    });

    const enriched = attributions.map((item: any) => {
      const ref = String(item.booking_id || '').toUpperCase();
      const c = commMap.get(ref);
      const b = bookMap.get(ref);

      const isPaid = c?.payment_verified || b?.payment_status === 'paid';
      let bookingStatus = 'Pending';
      if (b?.status === 'Cancelled' || c?.status === 'cancelled') bookingStatus = 'Cancelled';
      else if (b?.status === 'Completed' || c?.service_completed) bookingStatus = 'Completed';
      else if (b?.status === 'Ongoing') bookingStatus = 'Ongoing';

      return {
        ...item,
        customer_name: item.customer_name || b?.guest_name || 'Guest',
        treatment_name: b?.treatment_name || 'Spa Treatment',
        booking_status: bookingStatus,
        payment_status: isPaid ? 'paid' : 'unpaid',
        commission_status: c?.status || 'pending',
        commission_amount: c?.commission_amount || 0,
      };
    });

    return NextResponse.json({ success: true, referrals: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

