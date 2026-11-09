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

        // Strictly detect if user is on BookTherapick domain or brand
        const isTherapickSite = siteBrandFilter === 'therapick' || 
            (typeof window !== 'undefined' && (
                window.location.hostname.includes('therapick') || 
                window.location.hostname.includes('booktherapick')
            ));
        const effectiveBrand = isTherapickSite ? 'therapick' : siteBrandFilter;

        // Detect if this is a Partner Spa booking (venue/package).
        // Partner Spas are strictly internal and must NEVER be synced to the affiliate partner portal.
        const isPartnerSpaBooking = cartItems.some(i => 
            i.isPartner === true || 
            Boolean(i.partnerName) || 
            Boolean(i.partner_name) || 
            Boolean(i.partnerId) || 
            Boolean(i.partner_id) ||
            Boolean(i.publishedPrice) ||
            (typeof i.title === 'string' && (i.title.includes('·') || i.title.toLowerCase().includes('jaens') || i.title.toLowerCase().includes('partner spa')))
        ) || (typeof treatmentName === 'string' && (treatmentName.includes('·') || treatmentName.toLowerCase().includes('jaens') || treatmentName.toLowerCase().includes('partner spa')));

        // Determine booking source (Affiliate Partner Code or Direct)
        // Strictly exclude Partner Spas from affiliate attribution
        const affiliateCookie = (isTherapickSite && !isPartnerSpaBooking) ? getAffiliateCookie() : null;
        const affiliateCode = (!isPartnerSpaBooking && affiliateCookie?.partner_code) 
            ? affiliateCookie.partner_code.toUpperCase() 
            : null;
        const affiliateId = !isPartnerSpaBooking ? (affiliateCookie?.partner_id || null) : null;
        const source = isPartnerSpaBooking ? 'Partner Spa' : (affiliateCode ? affiliateCode : 'Direct');
        
        // Base payload strictly aligned with live PostgreSQL bookings schema
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
            brand: effectiveBrand,
            source: source,
            treatment_status: 'Scheduled',
            payment_status: 'Unpaid',
            payment_method: 'Cash',
            payment_amount: 0,
            affiliate_code: affiliateCode,
            affiliate_id: affiliateId,
            treatment_status_updated_at: new Date().toISOString(),
            payment_status_updated_at: new Date().toISOString(),
        };

        // Resilient adaptive insert: automatically removes any unmigrated columns if Postgres rejects them
        const activePayload = { ...basePayload };
        let insertError = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            const { error } = await supabase.from('bookings').insert([activePayload]);
            if (!error) {
                insertError = null;
                break;
            }
            insertError = error;
            const errMsg = error.message || '';
            const match = errMsg.match(/column [^.]*\.?([a-zA-Z0-9_]+) does not exist/i) ||
                          errMsg.match(/Could not find the '([^']+)' column of 'bookings'/i);
            if (match && match[1] && activePayload[match[1]] !== undefined) {
                console.warn(`Stripping unmapped column '${match[1]}' from booking insert.`);
                delete activePayload[match[1]];
                continue;
            }
            break;
        }

        if (insertError) {
            console.error('Failed to save booking to Supabase:', insertError);
            return { success: false, error: insertError, affiliateCode };
        }

        // Strictly associate affiliate attribution at booking creation time for Home Spa treatments only
        // Partner Spas are strictly for internal administration and do NOT sync to the affiliate partner portal
        if (isTherapickSite && affiliateCode && !isPartnerSpaBooking) {
            await recordBookingAffiliation(bookingId, formData, cartItems, totalPrice, 'therapick');
        }

        return { success: true, affiliateCode };
    } catch (err) {
        console.error('Exception saving booking:', err);
        return { success: false, error: err };
    }
};
