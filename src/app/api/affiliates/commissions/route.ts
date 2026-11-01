import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession, isPartnerApproved } from '@/lib/partnerAuth';

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

    if (!isPartnerApproved(session)) {
      return NextResponse.json(
        { success: false, message: `Partner account is ${session.status}. Only approved partners can view commissions.` },
        { status: 403 }
      );
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
        if (b.reference_number) {
          const raw = String(b.reference_number).toUpperCase();
          const clean = raw.replace(/^#/, '');
          bookingsMap.set(raw, b);
          bookingsMap.set(clean, b);
          bookingsMap.set(`#${clean}`, b);
        }
        if (b.id) {
          bookingsMap.set(String(b.id).toUpperCase(), b);
        }
      });
    }

    const enriched = commList.map((c: any) => {
      const bKey = String(c.booking_id || '').toUpperCase();
      const cleanBKey = bKey.replace(/^#/, '');
      const b = bookingsMap.get(bKey) || bookingsMap.get(cleanBKey) || bookingsMap.get(`#${cleanBKey}`);
      
      const bStatus = (b?.status || '').trim();
      const tStatus = (b?.treatment_status || '').trim();
      const isCancelled = c.status === 'cancelled' || bStatus.toLowerCase() === 'cancelled' || tStatus.toLowerCase() === 'cancelled';
      const isOngoing = bStatus.toLowerCase() === 'ongoing' || tStatus.toLowerCase() === 'in progress' || (c.notes || '').toLowerCase().includes('ongoing');
      const isCompleted = Boolean(c.service_completed) || bStatus.toLowerCase() === 'completed' || tStatus.toLowerCase() === 'finished';

      let displayBookingStatus = 'Pending';
      if (isCancelled) displayBookingStatus = 'Cancelled';
      else if (isCompleted) displayBookingStatus = 'Completed';
      else if (isOngoing) displayBookingStatus = 'Ongoing';
      else if (bStatus) displayBookingStatus = bStatus;

      let treatmentStatus = tStatus || 'Scheduled';
      if (isCancelled) treatmentStatus = 'Cancelled';
      else if (isCompleted) treatmentStatus = 'Finished';
      else if (isOngoing) treatmentStatus = 'In Progress';

      const isPaid = c.payment_verified || b?.payment_status === 'paid' || b?.payment_status === 'Paid';

      // Couple price safety cap
      const gross = Number(c.booking_amount_gross || 0);
      let treatmentAmt = Number(c.eligible_treatment_amount || 0);
      if (gross > 0 && treatmentAmt > gross) {
        treatmentAmt = gross;
      }

      return {
        ...c,
        eligible_treatment_amount: treatmentAmt,
        booking_status: displayBookingStatus,
        treatment_status: treatmentStatus,
        payment_status: isPaid ? 'paid' : 'unpaid',
        guest_name: b?.guest_name || 'Guest',
        treatment_name: b?.treatment_name || c.treatment_name || 'Spa Treatment',
        location: b?.location || c.location || '',
        room_number: b?.room_number || c.room_number || '',
        booking_date: b?.booking_date || '',
        time: b?.time || '',
        duration: (Array.isArray(b?.items) && b?.items[0]?.duration) ? String(b.items[0].duration) : '',
      };
    });

    return NextResponse.json({ success: true, commissions: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

