import { supabase } from '@/lib/supabase';
import { recordBookingAffiliation, getAffiliateCookie, clearAffiliateCookie } from '@/lib/affiliateAttribution';

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
        const affiliateCookie = getAffiliateCookie();
        const affiliateCode = (siteBrandFilter === 'therapick' && affiliateCookie?.partner_code) 
            ? affiliateCookie.partner_code.toUpperCase() 
            : null;
        const source = affiliateCode ? affiliateCode : 'Direct';
        
        // Base payload compatible with core bookings schema
        const basePayload: any = {
            reference_number: bookingId,
            guest_name: formData.name || '',
            guest_whatsapp: formData.whatsapp || formData.phone || '',
            guest_email: formData.email || '',
            booking_date: formData.date,
            time: formData.time,
            location: formData.location || '',
            room_number: formData.room || '',
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
            treatment_status_updated_at: new Date().toISOString(),
            payment_status_updated_at: new Date().toISOString(),
        };

        const { error: extendedError } = await supabase.from('bookings').insert([extendedPayload]);
        if (extendedError) {
            // Fallback to base payload if additive columns are not yet in Postgres schema cache
            const { error: baseError } = await supabase.from('bookings').insert([basePayload]);
            if (baseError) {
                console.error('Failed to save booking to Supabase:', baseError);
            }
        }

        // Strictly associate affiliate attribution at booking creation time
        if (siteBrandFilter === 'therapick') {
            await recordBookingAffiliation(bookingId, formData, cartItems, totalPrice, siteBrandFilter);
            // SINGLE-BOOKING ATTRIBUTION ENFORCEMENT:
            // Once a referral is used for a booking, immediately clear the cookie & session data.
            // Future bookings from this customer/device without a referral link will be strictly Direct.
            clearAffiliateCookie();
        }
    } catch (err) {
        console.error('Exception saving booking:', err);
    }
};
