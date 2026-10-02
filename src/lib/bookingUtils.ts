import { supabase } from '@/lib/supabase';

export const saveBookingToSupabase = async (
    bookingId: string, 
    formData: any, 
    cartItems: any[], 
    totalPrice: number,
    siteBrandFilter: string
) => {
    try {
        // We create a JSON string of the booking items so we can store it in the bookings table
        const itemsJson = JSON.stringify(cartItems);
        
        // The admin BookingManagement expects treatment_name, pax, revenue etc.
        // We'll summarize the cart items for the admin dashboard view.
        const treatmentName = cartItems.map(i => i.title).join(', ');
        const maxPax = cartItems.reduce((max, item) => Math.max(max, item.guests), 1);
        
        const payload = {
            reference_number: bookingId,
            guest_name: formData.name,
            booking_date: formData.date,
            booking_time: formData.time,
            location: formData.location,
            room_number: formData.room || '',
            total_price: totalPrice,
            revenue: totalPrice,
            treatment_name: treatmentName,
            pax: maxPax,
            therapists_count: maxPax, // default mapping for admin view
            therapist_fee_total: 0,
            net_profit: totalPrice, // until fee is added
            status: 'Pending',
            items: JSON.parse(itemsJson),
            brand: siteBrandFilter
        };

        const { error } = await supabase.from('bookings').insert([payload]);
        if (error) {
            console.error('Failed to save booking to Supabase:', error);
        }
    } catch (err) {
        console.error('Exception saving booking:', err);
    }
};
