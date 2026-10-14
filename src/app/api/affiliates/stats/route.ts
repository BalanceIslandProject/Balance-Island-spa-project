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

    const partnerId = session.id;

    // Run parallel queries for partner stats
    const [clicksRes, attributionsRes, commissionsRes, payoutsRes] = await Promise.all([
      supabase.from('affiliate_clicks').select('id, created_at', { count: 'exact' }).eq('partner_id', partnerId),
      supabase.from('affiliate_attributions').select('id, booking_id, customer_name, created_at', { count: 'exact' }).eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(10),
      supabase.from('affiliate_commissions').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }),
      supabase.from('affiliate_payouts').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }),
    ]);

    const totalClicks = clicksRes.count || 0;
    const commissions = commissionsRes.data || [];
    const totalBookings = commissions.length;

    // Fetch related bookings to get scheduled dates, customer names, and appointment times
    const bookingIds = commissions.map((c) => c.booking_id).filter(Boolean);
    let bookingsMap: Record<string, any> = {};
    if (bookingIds.length > 0) {
      const { data: matchedBookings } = await supabase
        .from('bookings')
        .select('reference_number, guest_name, booking_date, time, location, treatment_name, status')
        .in('reference_number', bookingIds);

      if (matchedBookings) {
        for (const b of matchedBookings) {
          if (b.reference_number) {
            bookingsMap[b.reference_number] = b;
          }
        }
      }
    }

    const attributionsMap: Record<string, any> = {};
    const attributions = attributionsRes.data || [];
    for (const a of attributions) {
      if (a.booking_id) {
        attributionsMap[a.booking_id] = a;
      }
    }

    // Build enriched calendar bookings
    const calendarBookings = commissions.map((comm) => {
      const matched = bookingsMap[comm.booking_id] || {};
      const attr = attributionsMap[comm.booking_id] || {};

      // Appointment date: prefer scheduled booking_date, otherwise fall back to commission created_at
      const appointmentDate = matched.booking_date || (comm.created_at ? comm.created_at.split('T')[0] : '');
      const appointmentTime = matched.time || '';
      const guestName = matched.guest_name || attr.customer_name || 'Guest';

      return {
        id: comm.id,
        booking_id: comm.booking_id,
        date: appointmentDate,
        time: appointmentTime,
        created_at: comm.created_at,
        guest_name: guestName,
        location: matched.location || '',
        treatment_name: matched.treatment_name || 'Mobile Spa Treatment',
        booking_status: matched.status || 'Confirmed',
        gross_amount: Number(comm.booking_amount_gross || 0),
        treatment_amount: Number(comm.eligible_treatment_amount || 0),
        commission_rate_pct: Number(comm.commission_rate_pct || 15),
        commission_amount: Number(comm.commission_amount || 0),
        commission_status: comm.status, // 'pending' | 'approved' | 'paid' | 'declined'
      };
    });

    let totalRevenue = 0;
    let eligibleTreatmentRevenue = 0;
    let pendingCommission = 0;
    let approvedCommission = 0;
    let paidCommission = 0;

    for (const comm of commissions) {
      totalRevenue += Number(comm.booking_amount_gross || 0);
      eligibleTreatmentRevenue += Number(comm.eligible_treatment_amount || 0);

      const amount = Number(comm.commission_amount || 0);
      if (comm.status === 'pending') {
        pendingCommission += amount;
      } else if (comm.status === 'approved') {
        approvedCommission += amount;
      } else if (comm.status === 'paid') {
        paidCommission += amount;
      }
    }

    const conversionRate = totalClicks > 0 ? ((totalBookings / totalClicks) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      stats: {
        totalClicks,
        totalBookings,
        conversionRate,
        totalRevenue,
        eligibleTreatmentRevenue,
        pendingCommission,
        approvedCommission,
        paidCommission,
        availableForPayout: approvedCommission,
      },
      calendarBookings,
      recentAttributions: attributionsRes.data || [],
      recentCommissions: commissions.slice(0, 5),
      recentPayouts: (payoutsRes.data || []).slice(0, 5),
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
