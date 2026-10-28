import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBookTherapickHost } from '@/lib/domainIsolation';
import { getPartnerSession, isPartnerApproved } from '@/lib/partnerAuth';

function cleanPayoutRef(ref?: string): string {
  if (!ref) return '';
  const parts = ref.split('-');
  if (parts.length >= 3) {
    const prefix = parts[0] || 'PAY';
    const pCode = parts[1].slice(0, 4);
    const tail = parts[2].slice(-4);
    return `${prefix}${pCode}${tail}`.toUpperCase();
  }
  return ref.replace(/-/g, '').toUpperCase();
}

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
        { success: false, message: `Partner account is ${session.status}. Only approved partners can view payouts.` },
        { status: 403 }
      );
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
    const attrMap = new Map<string, any>();

    if (bookingIds.length > 0) {
      const [bookingsRes, attributionsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('reference_number, id, guest_name, guest_whatsapp, booking_date, time, location, room_number, treatment_name, status')
          .in('reference_number', bookingIds),
        supabase
          .from('affiliate_attributions')
          .select('booking_id, customer_name, customer_phone')
          .in('booking_id', bookingIds),
      ]);

      (bookingsRes.data || []).forEach((b: any) => {
        if (b.reference_number) bookingsMap.set(b.reference_number.toUpperCase(), b);
        if (b.id) bookingsMap.set(String(b.id).toUpperCase(), b);
      });

      (attributionsRes.data || []).forEach((a: any) => {
        if (a.booking_id) attrMap.set(String(a.booking_id).toUpperCase(), a);
      });
    }

    const enrichedComms = commList.map((c: any) => {
      const bKey = String(c.booking_id || '').toUpperCase();
      const b = bookingsMap.get(bKey);
      const a = attrMap.get(bKey);
      return {
        ...c,
        guest_name: b?.guest_name || a?.customer_name || c.guest_name || 'Guest',
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
        payout_reference: cleanPayoutRef(p.payout_reference),
        items,
      };
    });

    return NextResponse.json({ success: true, payouts: enrichedPayouts });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
