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

    const { data: commissions, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('partner_id', session.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    const commList = commissions || [];
    const bookingIds = commList.map((c: any) => c.booking_id).filter(Boolean);

    let bookingsMap = new Map<string, any>();
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*');

      (bookings || []).forEach((b: any) => {
        if (b.reference_number) bookingsMap.set(b.reference_number.toUpperCase(), b);
        if (b.id) bookingsMap.set(String(b.id).toUpperCase(), b);
      });
    }

    const enriched = commList.map((c: any) => {
      const bKey = String(c.booking_id || '').toUpperCase();
      const b = bookingsMap.get(bKey);
      const bookingStatus = b?.status || (c.status === 'cancelled' ? 'Cancelled' : c.service_completed ? 'Completed' : 'Pending');
      const isPaid = c.payment_verified || b?.payment_status === 'paid';

      // Couple price safety cap
      const gross = Number(c.booking_amount_gross || 0);
      let treatmentAmt = Number(c.eligible_treatment_amount || 0);
      if (gross > 0 && treatmentAmt > gross) {
        treatmentAmt = gross;
      }

      return {
        ...c,
        eligible_treatment_amount: treatmentAmt,
        booking_status: bookingStatus,
        payment_status: isPaid ? 'paid' : 'unpaid',
        guest_name: b?.guest_name || 'Guest',
        treatment_name: b?.treatment_name || 'Spa Treatment',
      };
    });

    return NextResponse.json({ success: true, commissions: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

