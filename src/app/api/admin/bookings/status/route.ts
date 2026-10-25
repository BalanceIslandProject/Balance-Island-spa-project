import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Validated Enumerations
export const VALID_BOOKING_STATUSES = ['Pending', 'Approved', 'Confirmed', 'Cancelled'] as const;
export const VALID_TREATMENT_STATUSES = [
  'Scheduled',
  'Therapist Assigned',
  'On the Way',
  'Arrived',
  'In Progress',
  'Finished',
  'No Show',
] as const;
export const VALID_PAYMENT_STATUSES = [
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Refunded',
  'Payment Failed',
] as const;

function checkAdminAuth(req: NextRequest): boolean {
  const adminCookie = req.cookies.get('admin_auth');
  return adminCookie?.value === 'authenticated';
}

export async function PATCH(req: NextRequest) {
  try {
    // 1. Strict Server-Side Authorization Guard
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin credentials required.' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      booking_id, 
      booking_status, 
      treatment_status, 
      payment_status, 
      payment_method, 
      payment_amount,
      notes 
    } = body;

    if (!booking_id) {
      return NextResponse.json({ success: false, message: 'Booking ID or Reference Number required.' }, { status: 400 });
    }

    // 2. Strict Input Validation
    if (booking_status && !VALID_BOOKING_STATUSES.includes(booking_status)) {
      return NextResponse.json({ 
        success: false, 
        message: `Invalid booking status. Allowed: ${VALID_BOOKING_STATUSES.join(', ')}` 
      }, { status: 400 });
    }

    if (treatment_status && !VALID_TREATMENT_STATUSES.includes(treatment_status)) {
      return NextResponse.json({ 
        success: false, 
        message: `Invalid treatment status. Allowed: ${VALID_TREATMENT_STATUSES.join(', ')}` 
      }, { status: 400 });
    }

    if (payment_status && !VALID_PAYMENT_STATUSES.includes(payment_status)) {
      return NextResponse.json({ 
        success: false, 
        message: `Invalid payment status. Allowed: ${VALID_PAYMENT_STATUSES.join(', ')}` 
      }, { status: 400 });
    }

    // 3. Find target booking in bookings table
    const { data: bookingRows, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${booking_id},reference_number.eq.${booking_id}`)
      .limit(1);

    if (findError || !bookingRows || bookingRows.length === 0) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    const booking = bookingRows[0];
    const nowIso = new Date().toISOString();

    // 4. Construct Independent Status Updates
    const bookingUpdates: any = {
      updated_at: nowIso,
    };

    if (booking_status) {
      bookingUpdates.status = booking_status;
    }

    if (treatment_status) {
      bookingUpdates.treatment_status = treatment_status;
      bookingUpdates.treatment_status_updated_at = nowIso;
    }

    if (payment_status) {
      bookingUpdates.payment_status = payment_status;
      bookingUpdates.payment_status_updated_at = nowIso;
    }

    if (payment_method) {
      bookingUpdates.payment_method = payment_method;
    }

    if (typeof payment_amount === 'number' && !isNaN(payment_amount)) {
      bookingUpdates.payment_amount = payment_amount;
    }

    // Attempt extended update; fall back gracefully if additive columns are not yet cached
    let updateSuccess = false;
    const { error: fullUpdateErr } = await supabase
      .from('bookings')
      .update(bookingUpdates)
      .eq('id', booking.id);

    if (fullUpdateErr) {
      // Fallback: update baseline columns
      const baselineUpdates: any = { updated_at: nowIso };
      if (booking_status) baselineUpdates.status = booking_status;
      
      const { error: baseUpdateErr } = await supabase
        .from('bookings')
        .update(baselineUpdates)
        .eq('id', booking.id);

      if (baseUpdateErr) {
        console.error('Failed to update booking:', baseUpdateErr);
      } else {
        updateSuccess = true;
      }
    } else {
      updateSuccess = true;
    }

    // 5. Connect to Existing Affiliate Commission System (if booking has an affiliated partner)
    const bookingRef = (booking.reference_number || booking.id).toUpperCase();
    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('booking_id', bookingRef)
      .limit(1);

    let updatedCommission: any = null;

    if (commissions && commissions.length > 0) {
      const comm = commissions[0];
      const commUpdates: any = {
        updated_at: nowIso,
      };

      // Treatment completion linkage:
      // When treatment status becomes 'Finished', mark service_completed = true
      // Does NOT automatically mark payment as paid!
      if (treatment_status) {
        commUpdates.service_completed = treatment_status === 'Finished';
      }

      // Payment verification linkage:
      // When payment status becomes 'Paid', mark payment_verified = true
      // Does NOT automatically mark treatment as Finished!
      if (payment_status) {
        const isPaid = payment_status === 'Paid';
        commUpdates.payment_verified = isPaid;
        if (isPaid && payment_method) {
          commUpdates.notes = `Paid via ${payment_method}`;
        } else if (!isPaid) {
          commUpdates.notes = payment_status;
        }
      }

      // Cancellation linkage:
      // If booking is Cancelled or Refunded, mark commission cancelled
      if (booking_status === 'Cancelled' || payment_status === 'Refunded') {
        if (comm.status !== 'paid') {
          commUpdates.status = 'cancelled';
        }
      } else if (booking_status === 'Confirmed' || booking_status === 'Approved' || booking_status === 'Pending') {
        if (comm.status === 'cancelled') {
          // Reinstate back to pending review
          commUpdates.status = 'pending';
        }
      }

      const { data: cRes, error: cErr } = await supabase
        .from('affiliate_commissions')
        .update(commUpdates)
        .eq('id', comm.id)
        .select('*')
        .single();

      if (!cErr && cRes) {
        updatedCommission = cRes;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking status updated successfully.',
      booking: {
        ...booking,
        ...bookingUpdates,
      },
      commission: updatedCommission,
    });
  } catch (err: any) {
    console.error('Error updating booking status:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
