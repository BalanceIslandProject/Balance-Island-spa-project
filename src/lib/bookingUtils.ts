import { supabase } from '@/lib/supabase';
import { recordBookingAffiliation, getAffiliateCookie } from '@/lib/affiliateAttribution';

export const saveBookingToSupabase = async (
    bookingId: string, 
    formData: any, 
    cartItems: any[], 
    totalPrice: number,
    siteBrandFilter: string
) => {
    try {
        const itemsJson = JSON.stringify(cartItems);
        const treatmentName = cartItems.map(i => i.title).join(', ');
        const maxPax = cartItems.reduce((max, item) => Math.max(max, item.guests), 1);

        // Determine booking source (Affiliate Partner Code or Direct)
        const affiliateCookie = (siteBrandFilter === 'therapick') ? getAffiliateCookie() : null;
        const affiliateCode = affiliateCookie?.partner_code 
            ? affiliateCookie.partner_code.toUpperCase() 
            : null;
        const affiliateId = affiliateCookie?.partner_id || null;
        const source = affiliateCode ? affiliateCode : 'Direct';
        
        // Base payload compatible with core bookings schema
        const basePayload: any = {
            reference_number: bookingId,
            guest_name: formData?.name || 'Guest (WhatsApp Booking)',
            guest_whatsapp: formData?.whatsapp || formData?.phone || '',
            guest_email: formData?.email || '',
            booking_date: formData?.date || new Date().toISOString().split('T')[0],
            time: formData?.time || 'Pending CS Scheduling',
            location: formData?.location || 'Villa / Hotel (Confirmed on WhatsApp)',
            room_number: formData?.room || '',
            total_price: totalPrice,
            revenue: totalPrice,
            treatment_name: treatmentName,
            pax: maxPax,
            therapists_count: maxPax,
            therapist_fee_total: 0,
            net_profit: totalPrice,
            status: 'Pending',
            items: JSON.parse(itemsJson),
            brand: siteBrandFilter
        };

        // Try inserting with additive metadata columns if schema is migrated
        const extendedPayload = {
            ...basePayload,
            treatment_status: 'Scheduled',
            payment_status: 'Unpaid',
            payment_method: 'Cash',
            source: source,
            affiliate_code: affiliateCode,
            affiliate_id: affiliateId,
            treatment_status_updated_at: new Date().toISOString(),
            payment_status_updated_at: new Date().toISOString(),
        };

        const { error: extendedError } = await supabase.from('bookings').insert([extendedPayload]);
        if (extendedError) {
            // Fallback to base payload if additive columns are not yet in Postgres schema cache
            const { error: baseError } = await supabase.from('bookings').insert([basePayload]);
            if (baseError) {
                console.error('Failed to save booking to Supabase:', baseError);
                return { success: false, error: baseError, affiliateCode };
            }
        }

        // Strictly associate affiliate attribution at booking creation time
        if (siteBrandFilter === 'therapick' && affiliateCode) {
            await recordBookingAffiliation(bookingId, formData, cartItems, totalPrice, siteBrandFilter);
        }

        return { success: true, affiliateCode };
    } catch (err) {
        console.error('Exception saving booking:', err);
        return { success: false, error: err };
    }
};
