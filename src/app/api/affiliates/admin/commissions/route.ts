import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function checkAdminAuth(req: NextRequest): boolean {
  const adminCookie = req.cookies.get('admin_auth');
  return adminCookie?.value === 'authenticated';
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('affiliate_commissions')
      .select('*, affiliate_partners(first_name, last_name, business_name, email)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: commissions, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    let enrichedCommissions = commissions || [];
    if (enrichedCommissions.length > 0) {
      const bookingIds = Array.from(new Set(enrichedCommissions.map((c) => c.booking_id).filter(Boolean)));
      if (bookingIds.length > 0) {
        const [bookingsRes, attributionsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .in('reference_number', bookingIds),
          supabase
            .from('affiliate_attributions')
            .select('booking_id, customer_name, customer_phone')
            .in('booking_id', bookingIds),
        ]);

        const bookingMap: Record<string, any> = {};
        if (bookingsRes.data) {
          for (const b of bookingsRes.data) {
            if (b.reference_number) {
              bookingMap[b.reference_number] = b;
              bookingMap[b.reference_number.toUpperCase()] = b;
              bookingMap[b.reference_number.toLowerCase()] = b;
            }
          }
        }

        const attrMap: Record<string, any> = {};
        if (attributionsRes.data) {
          for (const a of attributionsRes.data) {
            if (a.booking_id) {
              attrMap[a.booking_id] = a;
              attrMap[a.booking_id.toUpperCase()] = a;
              attrMap[a.booking_id.toLowerCase()] = a;
            }
          }
        }

        enrichedCommissions = enrichedCommissions.map((c) => {
          const b = bookingMap[c.booking_id] || bookingMap[c.booking_id?.toUpperCase()] || bookingMap[c.booking_id?.toLowerCase()] || {};
          const a = attrMap[c.booking_id] || attrMap[c.booking_id?.toUpperCase()] || attrMap[c.booking_id?.toLowerCase()] || {};

          return {
            ...c,
            booking_date: b.booking_date || (c.created_at ? c.created_at.split('T')[0] : ''),
            booking_time: b.time || '',
            guest_name: b.guest_name || a.customer_name || 'Guest',
            guest_whatsapp: b.guest_whatsapp || a.customer_phone || '',
            location: b.location || '',
            room_number: b.room_number || '',
            treatment_name: b.treatment_name || 'Spa Treatment',
            booking_status: b.status || (c.service_completed ? 'Completed' : 'Pending'),
            treatment_status: b.treatment_status || (c.service_completed ? 'Finished' : 'Scheduled'),
            payment_status: b.payment_status || (c.payment_verified ? 'Paid' : 'Unpaid'),
          };
        });
      }
    }

    return NextResponse.json({ success: true, commissions: enrichedCommissions });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id, 
      status, 
      payment_verified, 
      service_completed, 
      booking_status, 
      treatment_status, 
      payment_status, 
      notes 
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Commission ID required' }, { status: 400 });
    }

    // 1. Fetch current commission record
    const { data: currentComm, error: fetchErr } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !currentComm) {
      return NextResponse.json({ success: false, message: 'Commission not found' }, { status: 404 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    // 2. Commission Eligibility Guard: Approval requires verified payment + completed treatment
    if (status === 'approved') {
      const isPaymentVerified = payment_verified !== undefined ? Boolean(payment_verified) : Boolean(currentComm.payment_verified);
      const isServiceCompleted = service_completed !== undefined ? Boolean(service_completed) : Boolean(currentComm.service_completed);

      if (!isPaymentVerified || !isServiceCompleted) {
        return NextResponse.json({
          success: false,
          message: 'Commission is not eligible for approval yet. Both verified payment and completed treatment are required.'
        }, { status: 400 });
      }

      updates.status = 'approved';
      updates.approved_at = new Date().toISOString();
    } else if (status !== undefined) {
      updates.status = status;
    }

    if (payment_verified !== undefined) updates.payment_verified = Boolean(payment_verified);
    if (service_completed !== undefined) updates.service_completed = Boolean(service_completed);
    if (notes !== undefined) updates.notes = notes;

    const { data: updated, error } = await supabase
      .from('affiliate_commissions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    // 3. Sync to linked booking in 'bookings' table independently
    if (updated?.booking_id) {
      const bookingUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update booking status if explicitly requested
      if (booking_status && ['Pending', 'Approved', 'Confirmed', 'Cancelled'].includes(booking_status)) {
        bookingUpdates.status = booking_status;
      }

      if (treatment_status) {
        bookingUpdates.treatment_status = treatment_status;
      } else if (service_completed !== undefined) {
        bookingUpdates.treatment_status = service_completed ? 'Finished' : 'Scheduled';
      }

      if (payment_status) {
        bookingUpdates.payment_status = payment_status;
      } else if (payment_verified !== undefined) {
        bookingUpdates.payment_status = payment_verified ? 'Paid' : 'Unpaid';
      }

      try {
        const { error: fullErr } = await supabase
          .from('bookings')
          .update(bookingUpdates)
          .ilike('reference_number', updated.booking_id);

        if (fullErr && bookingUpdates.status) {
          // Fallback to updating only status if extended columns are not yet in cache
          await supabase
            .from('bookings')
            .update({ status: bookingUpdates.status })
            .ilike('reference_number', updated.booking_id);
        }
      } catch (syncErr) {
        console.error('Error syncing booking:', syncErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      commission: {
        ...updated,
        booking_status: booking_status || (updated.service_completed ? 'Finished' : 'Scheduled'),
      } 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
