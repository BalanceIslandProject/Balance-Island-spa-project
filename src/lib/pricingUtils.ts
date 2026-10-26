/**
 * Pricing and Couple Treatment utilities
 * Ensures honeymoon packages and couples massage treatments are never multiplied twice.
 */

/**
 * Detects whether a treatment is a couple / honeymoon package.
 * These treatments are already priced for 2 persons on the website.
 */
export function isCoupleTreatment(title?: string): boolean {
    if (!title) return false;
    const t = title.toLowerCase();
    return /couple|honeymoon|duo|2\s*person|for\s*2/i.test(t);
}

/**
 * Calculates multiplier for treatment item:
 * - If couple/honeymoon treatment:
 *   Price is ALREADY set for 2 persons.
 *   1 or 2 guests = 1 package (multiplier = 1). DO NOT multiply amount again.
 *   3 or 4 guests = 2 packages (multiplier = 2), etc.
 *   In general: Math.max(1, Math.round(guests / 2)).
 * - For individual treatments:
 *   Multiplier is guests (or 1).
 */
export function getItemMultiplier(title?: string, guests?: number): number {
    const numGuests = Math.max(1, Number(guests) || 1);
    if (isCoupleTreatment(title)) {
        return Math.max(1, Math.round(numGuests / 2));
    }
    return numGuests;
}

export type PricingCartItem = {
    title: string;
    price: number;
    guests?: number;
};

export type PricingPromo = {
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
} | null;

/**
 * Calculates cart total price:
 * Safely computes subtotal, discount, and total without doubling couple/honeymoon packages.
 */
export function calculateCartTotal(
    items: PricingCartItem[],
    appliedPromo?: PricingPromo
): { subtotal: number; discount: number; total: number } {
    if (!items || items.length === 0) {
        return { subtotal: 0, discount: 0, total: 0 };
    }

    const subtotal = items.reduce((acc, item) => {
        const mult = getItemMultiplier(item.title, item.guests);
        return acc + (Number(item.price) || 0) * mult;
    }, 0);

    let discount = 0;
    if (appliedPromo) {
        if (appliedPromo.discount_type === 'percentage') {
            discount = subtotal * (appliedPromo.discount_value / 100);
        } else {
            discount = Number(appliedPromo.discount_value) || 0;
        }
    }

    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
}

/**
 * Dynamically computes the display price for a booking ticket card.
 * Even if an old draft had an incorrect doubled totalPrice in localStorage,
 * this recalculates the true price directly from the booking items.
 */
export function getBookingDisplayPrice(booking: {
    totalPrice?: number;
    items?: PricingCartItem[];
}): number {
    if (booking.items && booking.items.length > 0) {
        return booking.items.reduce((acc, item) => {
            const mult = getItemMultiplier(item.title, item.guests);
            return acc + (Number(item.price) || 0) * mult;
        }, 0);
    }
    return booking.totalPrice || 0;
}
