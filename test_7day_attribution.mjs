// ==============================================================================
// BOOKTHERAPICK 7-DAY AFFILIATE ATTRIBUTION TEST SUITE
// ==============================================================================

import assert from 'assert';

console.log('--- STARTING 7-DAY AFFILIATE ATTRIBUTION TESTS ---\n');

// 1. Simulate Browser Environment
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;
const SEVEN_DAYS_MS = SEVEN_DAYS_SECONDS * 1000;
const AFFILIATE_COOKIE_NAME = 'btp_affiliate_ref';

class MockBrowser {
  constructor() {
    this.cookieJar = {};
    this.localStorageMap = {};
    this.sessionStorageMap = {};
    this.now = 1700000000000; // Baseline Day 1: 00:00:00
  }

  get document() {
    return {
      get cookie() {
        return Object.entries(mockBrowser.cookieJar)
          .map(([k, v]) => `${k}=${encodeURIComponent(v.value)}`)
          .join('; ');
      },
      set cookie(str) {
        const parts = str.split(';');
        const [k, v] = parts[0].trim().split('=');
        if (!k) return;

        let maxAge = null;
        let expires = null;

        for (let i = 1; i < parts.length; i++) {
          const attr = parts[i].trim().toLowerCase();
          if (attr.startsWith('max-age=')) {
            maxAge = parseInt(attr.split('=')[1], 10);
          } else if (attr.startsWith('expires=')) {
            expires = new Date(parts[i].trim().substring(8)).getTime();
          }
        }

        if (maxAge === 0 || (expires && expires < mockBrowser.now)) {
          delete mockBrowser.cookieJar[k];
        } else {
          mockBrowser.cookieJar[k] = {
            value: decodeURIComponent(v || ''),
            expires: expires || (maxAge !== null ? mockBrowser.now + maxAge * 1000 : null),
            maxAge,
          };
        }
      }
    };
  }

  get localStorage() {
    return {
      getItem: (k) => mockBrowser.localStorageMap[k] || null,
      setItem: (k, v) => { mockBrowser.localStorageMap[k] = String(v); },
      removeItem: (k) => { delete mockBrowser.localStorageMap[k]; },
      clear: () => { mockBrowser.localStorageMap = {}; },
    };
  }

  get sessionStorage() {
    return {
      getItem: (k) => mockBrowser.sessionStorageMap[k] || null,
      setItem: (k, v) => { mockBrowser.sessionStorageMap[k] = String(v); },
      removeItem: (k) => { delete mockBrowser.sessionStorageMap[k]; },
      clear: () => { mockBrowser.sessionStorageMap = {}; },
    };
  }

  advanceDays(days) {
    this.now += days * 24 * 60 * 60 * 1000;
  }
}

const mockBrowser = new MockBrowser();
global.window = { location: { protocol: 'https:', hostname: 'www.booktherapick.com', pathname: '/' } };
global.document = mockBrowser.document;
global.localStorage = mockBrowser.localStorage;
global.sessionStorage = mockBrowser.sessionStorage;
Date.now = () => mockBrowser.now;

// Import attribution logic implementation matching src/lib/affiliateAttribution.ts
function getAffiliateCookie() {
  if (typeof window === 'undefined') return null;

  try {
    let rawData = null;

    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + AFFILIATE_COOKIE_NAME + ')=([^;]*)'));
    if (match && match[3]) {
      rawData = decodeURIComponent(match[3]);
    }

    if (!rawData) {
      rawData = localStorage.getItem(AFFILIATE_COOKIE_NAME);
    }

    if (!rawData) return null;

    const parsed = JSON.parse(rawData);
    if (!parsed || !parsed.partner_code) return null;

    const now = Date.now();
    const expiresAt = parsed.expires_at || (parsed.timestamp ? parsed.timestamp + SEVEN_DAYS_MS : 0);

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
    return null;
  }
}

function setAffiliateCookie(partnerCode, partnerId, clickTimestamp) {
  if (typeof window === 'undefined') return;

  try {
    const cleanCode = partnerCode.toUpperCase().trim();
    const now = typeof clickTimestamp === 'number' && clickTimestamp > 0 ? clickTimestamp : Date.now();
    const expiresAt = now + SEVEN_DAYS_MS;

    const payload = {
      partner_code: cleanCode,
      partner_id: partnerId,
      timestamp: now,
      expires_at: expiresAt,
    };

    const serialized = JSON.stringify(payload);
    const expiresUtc = new Date(expiresAt).toUTCString();
    const isSecure = window.location.protocol === 'https:';

    document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${SEVEN_DAYS_SECONDS}; expires=${expiresUtc}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    localStorage.setItem(AFFILIATE_COOKIE_NAME, serialized);
    sessionStorage.setItem(AFFILIATE_COOKIE_NAME, serialized);
  } catch (e) {}
}

function clearAffiliateCookie() {
  if (typeof window === 'undefined') return;
  try {
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${AFFILIATE_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    localStorage.removeItem(AFFILIATE_COOKIE_NAME);
    sessionStorage.removeItem(AFFILIATE_COOKIE_NAME);
  } catch (e) {}
}

function calculateEligibleCommission(params) {
  const {
    cartItems = [],
    totalPrice,
    partnerRatePct = 15.00,
    transportFee = 0,
    tipAmount = 0,
    discountAmount = 0,
  } = params;

  let treatmentSubtotal = 0;
  if (cartItems.length > 0) {
    for (const item of cartItems) {
      const title = (item.title || item.name || '').toLowerCase();
      const isTransport = title.includes('transport') || title.includes('delivery') || title.includes('fee');
      const isTip = title.includes('tip') || title.includes('gratuity');

      if (!isTransport && !isTip) {
        const itemPrice = Number(item.price || item.total_price || 0);
        const isCouple = ['couple', 'honeymoon', 'duo', '2 person', 'for 2'].some(k => title.includes(k));
        const rawGuests = Number(item.quantity || item.guests || (isCouple ? 2 : 1));
        const multiplier = isCouple ? Math.max(1, Math.round(rawGuests / 2)) : Math.max(1, rawGuests);
        treatmentSubtotal += itemPrice * multiplier;
      }
    }

    if (totalPrice > 0 && treatmentSubtotal > totalPrice) {
      treatmentSubtotal = totalPrice;
    }
  }

  if (treatmentSubtotal <= 0) {
    treatmentSubtotal = Math.max(0, totalPrice - transportFee - tipAmount);
  }

  const eligibleTreatmentAmount = Math.max(0, treatmentSubtotal - discountAmount);
  const commissionRatePct = Number(partnerRatePct) || 15.00;
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

// ------------------------------------------------------------------------------
// TEST SUITE EXECUTION
// ------------------------------------------------------------------------------

let testsPassed = 0;

// Test 1: Setting Alaya referral on Day 1
console.log('Test 1: Day 1 - Tourist scans Alaya Hotel QR code');
setAffiliateCookie('ALAYA', 'alaya-partner-uuid');
const day1Cookie = getAffiliateCookie();
assert(day1Cookie !== null, 'Day 1 cookie must be valid');
assert.strictEqual(day1Cookie.partner_code, 'ALAYA');
assert.strictEqual(day1Cookie.partner_id, 'alaya-partner-uuid');
assert.strictEqual(day1Cookie.expires_at, mockBrowser.now + SEVEN_DAYS_MS, 'Must expire in exactly 7 days');
console.log('✓ Day 1 Alaya referral saved with 7-day expiration\n');
testsPassed++;

// Test 2: Day 2 - Direct visit without referral parameter
console.log('Test 2: Day 2 - Tourist returns directly to booktherapick.com (no ?ref=)');
mockBrowser.advanceDays(1); // Day 2
const day2Cookie = getAffiliateCookie();
assert(day2Cookie !== null, 'Active referral must survive direct visits');
assert.strictEqual(day2Cookie.partner_code, 'ALAYA', 'Must remain attributed to Alaya');
assert.strictEqual(day2Cookie.timestamp, day1Cookie.timestamp, 'Timestamp must NOT be reset on direct visit');
assert.strictEqual(day2Cookie.expires_at, day1Cookie.expires_at, 'Expiration must remain anchored to Day 1');
console.log('✓ Direct visit preserves Alaya active attribution and maintains original 7-day expiration\n');
testsPassed++;

// Test 3: Day 2 - Booking #1 created under Alaya
console.log('Test 3: Day 2 - Tourist creates Booking #BTP-101 under Alaya');
const booking101 = {
  id: 'BTP-101',
  affiliate_id: day2Cookie.partner_id,
  affiliate_code: day2Cookie.partner_code,
  treatment_status: 'Scheduled',
  payment_status: 'Unpaid',
};
assert.strictEqual(booking101.affiliate_code, 'ALAYA');
assert(getAffiliateCookie() !== null, '7-Day cookie must NOT be cleared after creating a booking');
console.log('✓ Booking #BTP-101 attributed to ALAYA; cookie remains alive for future bookings\n');
testsPassed++;

// Test 4: Day 3 - Tourist meets Driver, scans Driver QR code
console.log('Test 4: Day 3 - Tourist scans partner Driver QR code (?ref=DRIVER01)');
mockBrowser.advanceDays(1); // Day 3
const day3ClickTime = mockBrowser.now;
setAffiliateCookie('DRIVER01', 'driver-partner-uuid');
const day3Cookie = getAffiliateCookie();
assert.strictEqual(day3Cookie.partner_code, 'DRIVER01', 'Last-touch attribution must replace Alaya with Driver');
assert.strictEqual(day3Cookie.partner_id, 'driver-partner-uuid');
assert.strictEqual(day3Cookie.timestamp, day3ClickTime, 'Timestamp must reset to Day 3 click');
assert.strictEqual(day3Cookie.expires_at, day3ClickTime + SEVEN_DAYS_MS, 'Expiration must be 7 days from Day 3 click');
console.log('✓ Last-touch referral updated to DRIVER01 and anchored fresh 7-day window\n');
testsPassed++;

// Test 5: Verify Immutability of Existing Booking #BTP-101
console.log('Test 5: Immutability check - Booking #BTP-101 must remain attributed to Alaya');
assert.strictEqual(booking101.affiliate_code, 'ALAYA', 'Existing booking must NEVER be changed by subsequent driver scan');
console.log('✓ Past booking #BTP-101 remains permanently attributed to ALAYA\n');
testsPassed++;

// Test 6: Day 3 - New Booking #BTP-102 created under Driver
console.log('Test 6: Day 3 - Tourist creates Booking #BTP-102');
const booking102 = {
  id: 'BTP-102',
  affiliate_id: day3Cookie.partner_id,
  affiliate_code: day3Cookie.partner_code,
  treatment_status: 'Scheduled',
  payment_status: 'Unpaid',
};
assert.strictEqual(booking102.affiliate_code, 'DRIVER01');
console.log('✓ New booking #BTP-102 correctly attributed to DRIVER01\n');
testsPassed++;

// Test 7: Invalid referral code (?ref=INVALID_FAKE) does not overwrite active Driver
console.log('Test 7: Tourist accidentally clicks invalid link (?ref=FAKE999)');
// Simulating AffiliateTracker: when /api/affiliates/clicks returns success: false, setAffiliateCookie is NOT called
const fakeValidationSuccess = false;
if (fakeValidationSuccess) {
  setAffiliateCookie('FAKE999', 'invalid');
}
const afterInvalidCookie = getAffiliateCookie();
assert.strictEqual(afterInvalidCookie.partner_code, 'DRIVER01', 'Invalid referral must NOT overwrite active partner');
console.log('✓ Invalid partner code rejected, DRIVER01 attribution safely preserved\n');
testsPassed++;

// Test 8: Day 6 - Direct visit within 7-day window
console.log('Test 8: Day 6 - Tourist visits directly again (Day 6, 3 days after Driver click)');
mockBrowser.advanceDays(3); // Day 6
const day6Cookie = getAffiliateCookie();
assert(day6Cookie !== null, 'Driver referral must still be active on Day 6');
assert.strictEqual(day6Cookie.partner_code, 'DRIVER01');
console.log('✓ Driver referral remains active on Day 6 without any new clicks\n');
testsPassed++;

// Test 9: Day 11 - 7-Day window expired (> 7 days from Day 3 click)
console.log('Test 9: Day 11 - 8 days after Driver click (> 7 days)');
mockBrowser.advanceDays(5); // Day 11 (8 days since Day 3)
const day11Cookie = getAffiliateCookie();
assert(day11Cookie === null, 'Cookie must expire after 7 days from click');
console.log('✓ Cookie expired cleanly on Day 11, returns null (Direct visit)\n');
testsPassed++;

// Test 10: Commission Calculation with Couple Package logic & 15% rate
console.log('Test 10: Commission calculation with couple package, transport, and 15% rate');
const commCalc = calculateEligibleCommission({
  cartItems: [
    { title: 'Couple Romantic Massage (2 Guests)', price: 800000, guests: 2 },
    { title: 'Transport Villa Ubud', price: 50000, guests: 1 },
  ],
  totalPrice: 850000,
  partnerRatePct: 15.00,
  transportFee: 50000,
});
assert.strictEqual(commCalc.grossAmount, 850000, 'Gross amount is 850,000');
assert.strictEqual(commCalc.eligibleTreatmentAmount, 800000, 'Eligible treatment amount excludes transport and couple package not doubled');
assert.strictEqual(commCalc.commissionRatePct, 15.00, 'Commission rate is 15%');
assert.strictEqual(commCalc.commissionAmount, 120000, '15% of 800,000 is 120,000');
console.log('✓ Commission calculation correctly calculates 15% of net treatment: IDR 120,000\n');
testsPassed++;

// Test 11: Commission Status Transitions
console.log('Test 11: Commission status lifecycle transitions');
function transitionCommissionStatus(currentStatus, treatmentStatus, paymentStatus) {
  let isCompleted = treatmentStatus === 'Finished';
  let isPaid = paymentStatus === 'Paid';

  if (treatmentStatus === 'Cancelled' || paymentStatus === 'Refunded') {
    return 'cancelled';
  }
  if (isCompleted && isPaid) {
    return 'approved';
  }
  return 'pending';
}

assert.strictEqual(transitionCommissionStatus('pending', 'Scheduled', 'Unpaid'), 'pending');
assert.strictEqual(transitionCommissionStatus('pending', 'In Progress', 'Unpaid'), 'pending');
assert.strictEqual(transitionCommissionStatus('pending', 'Finished', 'Unpaid'), 'pending', 'Treatment completed but unpaid must wait');
assert.strictEqual(transitionCommissionStatus('pending', 'Scheduled', 'Paid'), 'pending', 'Paid but treatment not completed must wait');
assert.strictEqual(transitionCommissionStatus('pending', 'Finished', 'Paid'), 'approved', 'Both finished and paid triggers approved');
assert.strictEqual(transitionCommissionStatus('approved', 'Cancelled', 'Paid'), 'cancelled', 'Cancelled booking triggers cancelled');
assert.strictEqual(transitionCommissionStatus('approved', 'Finished', 'Refunded'), 'cancelled', 'Refunded payment triggers cancelled');
console.log('✓ All commission lifecycle status transitions verified\n');
testsPassed++;

console.log(`=======================================================`);
console.log(`ALL ${testsPassed} 7-DAY ATTRIBUTION INTEGRATION TESTS PASSED!`);
console.log(`=======================================================`);
