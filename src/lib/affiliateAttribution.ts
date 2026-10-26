import { supabase } from '@/lib/supabase';

export const AFFILIATE_COOKIE_NAME = 'btp_affiliate_ref';
export const DEFAULT_COMMISSION_RATE_PCT = 15.00;
export const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds (7 days)
export const SEVEN_DAYS_MS = SEVEN_DAYS_SECONDS * 1000; // 604,800,000 milliseconds

export interface AffiliateCookieData {
  partner_code: string;
  partner_id: string;
  timestamp: number;
  expires_at: number;
}

/**
 * Reads the active affiliate tracking data under the 7-day attribution model:
 * - Checks 1st-party cookie first, with localStorage fallback.
 * - Enforces 7-day window from the most recent eligible referral touch.
 * - Direct visits and page refreshes do NOT clear or reset active referrals.
 * - Returns null if referral has expired or is invalid.
 */
export function getAffiliateCookie(): AffiliateCookieData | null {
  if (typeof window === 'undefined') return null;

  try {
    let rawData: string | null = null;

    // 1. Check document.cookie
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + AFFILIATE_COOKIE_NAME + ')=([^;]*)'));
    if (match && match[3]) {
      rawData = decodeURIComponent(match[3]);
    }

    // 2. Fallback to localStorage (ensures client resilience if cookies are restricted)
    if (!rawData) {
      rawData = localStorage.getItem(AFFILIATE_COOKIE_NAME);
    }

    if (!rawData) return null;

    const parsed = JSON.parse(rawData) as AffiliateCookieData;
    if (!parsed || !parsed.partner_code) {
      return null;
    }

    const now = Date.now();
    const expiresAt = parsed.expires_at || (parsed.timestamp ? parsed.timestamp + SEVEN_DAYS_MS : 0);

    // 3. Strict 7-Day Window Enforcement:
    // If the 7-day window has expired, clear the stored referral and return null
    if (!expiresAt || now > expiresAt || (parsed.timestamp && (now - parsed.timestamp) > SEVEN_DAYS_MS)) {
      clearAffiliateCookie();
      return null;
    }

    return {
      partner_code: parsed.partner_code.toUpperCase().trim(),
      partner_id: parsed.partner_id || '',
      timestamp: parsed.timestamp || now,
      expires_at: expiresAt,
    };
  } catch (e) {
    console.error('Error reading affiliate tracking cookie:', e);
    return null;
  }
}

/**
 * Sets the affiliate tracking session for a valid referred partner:
 * - Cookie duration: 7 days (604,800 seconds) from this referral touch.
 * - Security: SameSite=Lax, Path=/, and Secure on HTTPS.
 * - Stores timestamp and explicit expires_at.
 * - Last-touch attribution: Overwrites any prior partner referral for future bookings.
 */
export function setAffiliateCookie(partnerCode: string, partnerId: string, clickTimestamp?: number): void {
  if (typeof window === 'undefined') return;

  try {
    const cleanCode = partnerCode.toUpperCase().trim();
    const now = typeof clickTimestamp === 'number' && clickTimestamp > 0 ? clickTimestamp : Date.now();
    const expiresAt = now + SEVEN_DAYS_MS;

    const payload: AffiliateCookieData = {
      partner_code: cleanCode,
      partner_id: partnerId,
      timestamp: now,
      expires_at: expiresAt,
    };

    const serialized = JSON.stringify(payload);
    const expiresUtc = new Date(expiresAt).toUTCString();
    const isSecure = window.location.protocol === 'https:';

    // 1. Write first-party cookie with 7-day max-age and UTC expiration
    document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${SEVEN_DAYS_SECONDS}; expires=${expiresUtc}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

    // 2. Persist to localStorage and sessionStorage as resilient client backup
    localStorage.setItem(AFFILIATE_COOKIE_NAME, serialized);
    sessionStorage.setItem(AFFILIATE_COOKIE_NAME, serialized);
  } catch (e) {
    console.error('Error setting affiliate tracking cookie:', e);
  }
}

/**
 * Clears the affiliate tracking cookie and client storage.
 * Only invoked when a 7-day attribution window expires or upon explicit reset.
 */
export function clearAffiliateCookie(): void {
  if (typeof window === 'undefined') return;

  try {
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${AFFILIATE_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    
    if (window.location.hostname) {
      document.cookie = `${AFFILIATE_COOKIE_NAME}=; path=/; domain=${window.location.hostname}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    }

    localStorage.removeItem(AFFILIATE_COOKIE_NAME);
    sessionStorage.removeItem(AFFILIATE_COOKIE_NAME);
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

    // 5. Synchronize bookings table with validated affiliate ID & code
    try {
      await supabase
        .from('bookings')
        .update({
          affiliate_id: partner.id,
          affiliate_code: partner.partner_code,
          source: partner.partner_code,
        })
        .or(`id.eq.${bookingId},reference_number.eq.${bookingId}`);
    } catch (syncErr) {
      console.warn('Non-fatal: failed to backfill affiliate_id on bookings row:', syncErr);
    }

    // Retain 7-day cookie for subsequent bookings within attribution window
    return true;
  } catch (err) {
    console.error('Error recording affiliate attribution:', err);
    return false;
  }
}
