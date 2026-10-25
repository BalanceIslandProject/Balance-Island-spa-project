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

    const { data: payouts, error } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('partner_id', session.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    // Also get all commissions for this partner to populate itemized bookings
    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('partner_id', session.id)
      .order('created_at', { ascending: false });

    // Fetch corresponding bookings
    const commList = commissions || [];
    const bookingIds = commList.map((c: any) => c.booking_id).filter(Boolean);
    const bookingsMap = new Map<string, any>();
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('reference_number, id, guest_name, guest_whatsapp, booking_date, time, location, room_number, treatment_name, status, payment_status');

      (bookings || []).forEach((b: any) => {
        if (b.reference_number) bookingsMap.set(b.reference_number.toUpperCase(), b);
        if (b.id) bookingsMap.set(String(b.id).toUpperCase(), b);
      });
    }

    const enrichedComms = commList.map((c: any) => {
      const bKey = String(c.booking_id || '').toUpperCase();
      const b = bookingsMap.get(bKey);
      return {
        ...c,
        guest_name: b?.guest_name || c.guest_name || 'Guest',
        treatment_name: b?.treatment_name || c.treatment_name || 'Spa Treatment',
        booking_date: b?.booking_date || c.booking_date || (c.created_at ? c.created_at.split('T')[0] : ''),
        booking_time: b?.time || c.booking_time || '',
        location: b?.location || c.location || '',
        room_number: b?.room_number || c.room_number || '',
      };
    });

    const enrichedPayouts = (payouts || []).map((p: any) => {
      let items = enrichedComms.filter((c: any) => c.payout_id === p.id);
      // Fallback: If legacy payout has no commissions with matching payout_id, find paid commissions
      if (items.length === 0 && enrichedComms.some((c: any) => c.status === 'paid')) {
        items = enrichedComms.filter((c: any) => c.status === 'paid');
      }
      return {
        ...p,
        items,
      };
    });

    return NextResponse.json({ success: true, payouts: enrichedPayouts });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
