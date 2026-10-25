import { supabase } from '@/lib/supabase';

export const AFFILIATE_COOKIE_NAME = 'btp_affiliate_ref';
export const DEFAULT_COMMISSION_RATE_PCT = 15.00;

export interface AffiliateCookieData {
  partner_code: string;
  partner_id: string;
  timestamp: number;
}

/**
 * Reads the affiliate tracking data.
 * STRICT PER-BOOKING LOGIC:
 * - If referral was already consumed for a booking in this session, returns null.
 * - Prioritizes active sessionStorage.
 * - Direct visits without an active referral link session will never inherit stale referrals.
 */
export function getAffiliateCookie(): AffiliateCookieData | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. If already consumed by a previous booking on this device, reject
    if (sessionStorage.getItem('btp_affiliate_consumed') === 'true') {
      return null;
    }

    // 2. Check active sessionStorage first (scoped strictly to current referred tab)
    const sessionData = sessionStorage.getItem(AFFILIATE_COOKIE_NAME);
    if (sessionData) {
      const parsed = JSON.parse(sessionData) as AffiliateCookieData;
      if (parsed && parsed.partner_code) {
        return parsed;
      }
    }

    // 3. Fallback to document.cookie (session cookie)
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + AFFILIATE_COOKIE_NAME + ')=([^;]*)'));
    if (!match || !match[3]) return null;

    const decoded = decodeURIComponent(match[3]);
    const parsed = JSON.parse(decoded) as AffiliateCookieData;
    if (parsed && parsed.partner_code) {
      return parsed;
    }
  } catch (e) {
    console.error('Error parsing affiliate cookie:', e);
  }
  return null;
}

/**
 * Sets the affiliate tracking session for a referred booking.
 * Note: Session-only cookie (NO persistent 30-day max-age) and sessionStorage
 * to ensure that subsequent direct bookings on the same phone will NOT be attributed.
 */
export function setAffiliateCookie(partnerCode: string, partnerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: AffiliateCookieData = {
      partner_code: partnerCode.toUpperCase(),
      partner_id: partnerId,
      timestamp: Date.now(),
    };

    const serialized = JSON.stringify(payload);
    sessionStorage.setItem(AFFILIATE_COOKIE_NAME, serialized);
    sessionStorage.removeItem('btp_affiliate_consumed');

    // Set as browser session cookie (no max-age/expires: dies when browser session closes)
    document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; SameSite=Lax`;
  } catch (e) {
    console.error('Error setting affiliate cookie:', e);
  }
}

/**
 * Clears the affiliate tracking cookie and session data immediately.
 * Called as soon as a booking is completed so repeat organic visits
 * from the same tourist or phone are strictly recorded as Direct.
 */
export function clearAffiliateCookie(): void {
  if (typeof window === 'undefined') return;

  try {
    document.cookie = `${AFFILIATE_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `${AFFILIATE_COOKIE_NAME}=; path=/; domain=${window.location.hostname}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

    sessionStorage.removeItem(AFFILIATE_COOKIE_NAME);
    sessionStorage.setItem('btp_affiliate_consumed', 'true');
    localStorage.removeItem(AFFILIATE_COOKIE_NAME);
  } catch (e) {
    console.error('Error clearing affiliate cookie:', e);
  }
}

/**
 * Calculates net eligible treatment commission according to BookTherapick rules:
 * - Default 15% rate (or partner-custom rate)
 * - Excludes transport fees, tips, and other non-treatment add-ons
 * - Calculates on actual net treatment revenue after discounts
 */
export function calculateEligibleCommission(params: {
  cartItems?: any[];
  totalPrice: number;
  partnerRatePct?: number;
  transportFee?: number;
  tipAmount?: number;
  discountAmount?: number;
}) {
  const {
    cartItems = [],
    totalPrice,
    partnerRatePct = DEFAULT_COMMISSION_RATE_PCT,
    transportFee = 0,
    tipAmount = 0,
    discountAmount = 0,
  } = params;

  // Filter items: treat treatments as eligible, ignore transport items if labeled as such
  let treatmentSubtotal = 0;
  if (cartItems.length > 0) {
    for (const item of cartItems) {
      const title = (item.title || item.name || '').toLowerCase();
      const isTransport = title.includes('transport') || title.includes('delivery') || title.includes('fee');
      const isTip = title.includes('tip') || title.includes('gratuity');

      if (!isTransport && !isTip) {
        const itemPrice = Number(item.price || item.total_price || 0);
        // Couple massage & honeymoon packages are ALREADY priced for 2 persons on the website.
        // Do NOT multiply by 2 again. (2 guests = 1 couple package price).
        const isCouple = ['couple', 'honeymoon', 'duo', '2 person', 'for 2'].some(k => title.includes(k));
        const rawGuests = Number(item.quantity || item.guests || (isCouple ? 2 : 1));
        const multiplier = isCouple ? Math.max(1, Math.round(rawGuests / 2)) : Math.max(1, rawGuests);
        treatmentSubtotal += itemPrice * multiplier;
      }
    }

    // Safety guard: treatmentSubtotal cannot exceed total booking price
    if (totalPrice > 0 && treatmentSubtotal > totalPrice) {
      treatmentSubtotal = totalPrice;
    }
  }

  // Fallback: If cartItems was empty or subtotal is zero, derive from totalPrice minus explicit transport and tip
  if (treatmentSubtotal <= 0) {
    treatmentSubtotal = Math.max(0, totalPrice - transportFee - tipAmount);
  }

  // Net treatment revenue after applied discount
  const eligibleTreatmentAmount = Math.max(0, treatmentSubtotal - discountAmount);
  const commissionRatePct = Number(partnerRatePct) || DEFAULT_COMMISSION_RATE_PCT;
  const commissionAmount = Math.round((eligibleTreatmentAmount * commissionRatePct) / 100);

  return {
    grossAmount: totalPrice,
    eligibleTreatmentAmount,
    transportFee,
    tipAmount,
    discountAmount,
    commissionRatePct,
    commissionAmount,
  };
}

/**
 * Records booking affiliation if customer was referred by an approved partner on BookTherapick.
 * GUARANTEE: Strictly no-op if siteBrand is not 'therapick'.
 */
export async function recordBookingAffiliation(
  bookingId: string,
  formData: any,
  cartItems: any[],
  totalPrice: number,
  siteBrand: string
): Promise<boolean> {
  // STRICT DOMAIN ISOLATION:
  // Never attribute or track commissions on non-BookTherapick brands
  if (siteBrand !== 'therapick') {
    return false;
  }

  const cookieData = getAffiliateCookie();
  if (!cookieData || !cookieData.partner_code) {
    return false;
  }

  try {
    // 1. Verify that partner exists and is currently active
    const { data: partner, error: partnerError } = await supabase
      .from('affiliate_partners')
      .select('id, partner_code, commission_rate_pct, status')
      .eq('partner_code', cookieData.partner_code.toUpperCase())
      .single();

    if (partnerError || !partner || partner.status !== 'active') {
      return false;
    }

    // 2. Calculate eligible commission
    const calculation = calculateEligibleCommission({
      cartItems,
      totalPrice,
      partnerRatePct: partner.commission_rate_pct,
    });

    // 2b. Idempotency Check: Prevent duplicate commissions or attributions
    const { data: existingComm } = await supabase
      .from('affiliate_commissions')
      .select('id')
      .eq('booking_id', bookingId)
      .limit(1);

    if (existingComm && existingComm.length > 0) {
      return true; // Already created, prevent duplicate
    }

    const firstTouchAt = cookieData.timestamp ? new Date(cookieData.timestamp).toISOString() : new Date().toISOString();

    // 3. Record Attribution (if not already recorded)
    const { data: existingAttr } = await supabase
      .from('affiliate_attributions')
      .select('id')
      .eq('booking_id', bookingId)
      .limit(1);

    if (!existingAttr || existingAttr.length === 0) {
      await supabase.from('affiliate_attributions').insert([
        {
          partner_id: partner.id,
          partner_code: partner.partner_code,
          booking_id: bookingId,
          customer_name: formData.name || null,
          customer_email: formData.email || null,
          customer_phone: formData.phone || formData.whatsapp || null,
          first_touch_at: firstTouchAt,
          last_touch_at: new Date().toISOString(),
        },
      ]);
    }

    // 4. Record Pending Commission (Strictly unverified and service uncompleted until admin verifies)
    await supabase.from('affiliate_commissions').insert([
      {
        partner_id: partner.id,
        partner_code: partner.partner_code,
        booking_id: bookingId,
        booking_amount_gross: calculation.grossAmount,
        eligible_treatment_amount: calculation.eligibleTreatmentAmount,
        transport_fee: calculation.transportFee,
        tip_amount: calculation.tipAmount,
        discount_amount: calculation.discountAmount,
        commission_rate_pct: calculation.commissionRatePct,
        commission_amount: calculation.commissionAmount,
        status: 'pending',
        payment_verified: false,
        service_completed: false,
        notes: `Auto-attributed for BookTherapick booking #${bookingId}`,
      },
    ]);

    // 5. Consume referral tracking immediately so subsequent direct bookings are 100% Direct
    clearAffiliateCookie();

    return true;
  } catch (err) {
    console.error('Error recording affiliate attribution:', err);
    return false;
  }
}
