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
      const bId = comm.booking_id || '';
      const matched = bookingsMap[bId] || bookingsMap[bId.toUpperCase()] || bookingsMap[bId.toLowerCase()] || {};
      const attr = attributionsMap[bId] || attributionsMap[bId.toUpperCase()] || {};

      // Appointment date: prefer scheduled booking_date, otherwise fall back to commission created_at
      const appointmentDate = matched.booking_date || (comm.created_at ? comm.created_at.split('T')[0] : '');
      const appointmentTime = matched.time || '';
      const guestName = matched.guest_name || attr.customer_name || 'Guest';

      const rawBookingStatus = (matched.status || 'Pending').trim();
      const isPaid = Boolean(comm.payment_verified);
      const isCancelled = rawBookingStatus.toLowerCase() === 'cancelled' || comm.status === 'cancelled' || comm.status === 'declined';
      const isCompleted = Boolean(comm.service_completed) || rawBookingStatus.toLowerCase() === 'completed';
      const isOngoing = rawBookingStatus.toLowerCase() === 'ongoing';
      const isConfirmed = rawBookingStatus.toLowerCase() === 'confirmed';

      let displayBookingStatus = 'Pending';
      if (isCancelled) displayBookingStatus = 'Cancelled';
      else if (isCompleted) displayBookingStatus = 'Completed';
      else if (isOngoing) displayBookingStatus = 'Ongoing';
      else if (isConfirmed) displayBookingStatus = 'Confirmed';

      // Couple massage pricing logic:
      // If couple treatment was multiplied by guests, ensure treatment amount does NOT exceed gross booking amount
      const grossAmount = Number(comm.booking_amount_gross || 0);
      let treatmentAmount = Number(comm.eligible_treatment_amount || 0);
      if (grossAmount > 0 && treatmentAmount > grossAmount) {
        treatmentAmount = grossAmount;
      }

      const commissionRatePct = Number(comm.commission_rate_pct || 15);
      let commissionAmount = Number(comm.commission_amount || 0);
      if (isCancelled) {
        commissionAmount = 0;
      } else if (grossAmount > 0 && Number(comm.eligible_treatment_amount || 0) > grossAmount) {
        commissionAmount = Math.round((treatmentAmount * commissionRatePct) / 100);
      }

      return {
        id: comm.id,
        booking_id: comm.booking_id,
        date: appointmentDate,
        time: appointmentTime,
        created_at: comm.created_at,
        guest_name: guestName,
        location: matched.location || '',
        treatment_name: matched.treatment_name || 'Mobile Spa Treatment',
        booking_status: displayBookingStatus,
        payment_status: isPaid ? 'paid' : 'unpaid',
        payment_verified: isPaid,
        service_completed: isCompleted,
        gross_amount: grossAmount,
        treatment_amount: treatmentAmount,
        commission_rate_pct: commissionRatePct,
        commission_amount: commissionAmount,
        commission_status: isCancelled ? 'cancelled' : comm.status, // 'pending' | 'approved' | 'paid' | 'cancelled'
      };
    });

    let totalRevenue = 0;
    let eligibleTreatmentRevenue = 0;
    let pendingCommission = 0;
    let approvedCommission = 0;
    let paidCommission = 0;

    for (const comm of commissions) {
      const bId = comm.booking_id || '';
      const matched = bookingsMap[bId] || bookingsMap[bId.toUpperCase()] || bookingsMap[bId.toLowerCase()] || {};
      const isCancelled = (matched.status || '').toLowerCase() === 'cancelled' || comm.status === 'cancelled' || comm.status === 'declined';
      
      if (isCancelled) continue; // Exclude cancelled from active commission totals

      const grossAmount = Number(comm.booking_amount_gross || 0);
      let eligibleAmount = Number(comm.eligible_treatment_amount || 0);
      if (grossAmount > 0 && eligibleAmount > grossAmount) {
        eligibleAmount = grossAmount;
      }

      totalRevenue += grossAmount;
      eligibleTreatmentRevenue += eligibleAmount;

      let amount = Number(comm.commission_amount || 0);
      if (grossAmount > 0 && Number(comm.eligible_treatment_amount || 0) > grossAmount) {
        amount = Math.round((eligibleAmount * Number(comm.commission_rate_pct || 15)) / 100);
      }

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
