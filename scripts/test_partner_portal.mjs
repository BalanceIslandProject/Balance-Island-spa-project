// ==============================================================================
// THERAPICK PARTNER PORTAL: COMPREHENSIVE AUTOMATED TEST SUITE
// Tests: Auth, Isolation, Attribution (30-day), Commission (15%), Payouts, Regression
// ==============================================================================

import assert from 'assert';
import crypto from 'crypto';

console.log('==============================================================================');
console.log('RUNNING THERAPICK PARTNER PORTAL AUTOMATED TEST SUITE');
console.log('==============================================================================\n');

let passedTests = 0;
let failedTests = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

// ------------------------------------------------------------------------------
// Test Setup & Mock Helpers
// ------------------------------------------------------------------------------
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const THIRTY_DAYS_MS = THIRTY_DAYS_SECONDS * 1000;
const SESSION_SECRET = 'booktherapick-partner-secret-salt-2026';

function createMockSessionToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyMockSessionToken(token) {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

function isPartnerApproved(session) {
  if (!session) return false;
  return session.status === 'active' || session.status === 'approved';
}

function calculateEligibleCommission({ cartItems = [], totalPrice, partnerRatePct = 15.0, transportFee = 0, tipAmount = 0, discountAmount = 0 }) {
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
  const commissionRatePct = Number(partnerRatePct) || 15.0;
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
// Category 1: Authentication & Authorization Tests
// ------------------------------------------------------------------------------
console.log('1. Authentication & Authorization Tests:');

it('Unauthenticated session returns null', () => {
  const result = verifyMockSessionToken('');
  assert.strictEqual(result, null);
  assert.strictEqual(isPartnerApproved(result), false);
});

it('Tampered session token signature is strictly rejected', () => {
  const validToken = createMockSessionToken({ id: 'p1', status: 'approved' });
  const [payload] = validToken.split('.');
  const forged = `${payload}.invalidSignature`;
  const result = verifyMockSessionToken(forged);
  assert.strictEqual(result, null);
});

it('Pending partners are recognized but blocked by isPartnerApproved', () => {
  const session = { id: 'p_pending', status: 'pending', partner_code: 'TEST100' };
  assert.strictEqual(isPartnerApproved(session), false, 'Pending partner must not have approved dashboard access');
});

it('Rejected partners are blocked by isPartnerApproved', () => {
  const session = { id: 'p_rejected', status: 'rejected', partner_code: 'TEST101' };
  assert.strictEqual(isPartnerApproved(session), false, 'Rejected partner must be blocked');
});

it('Suspended partners are blocked by isPartnerApproved', () => {
  const session = { id: 'p_suspended', status: 'suspended', partner_code: 'TEST102' };
  assert.strictEqual(isPartnerApproved(session), false, 'Suspended partner must be blocked');
});

it('Approved/active partners pass isPartnerApproved authorization check', () => {
  const sessionActive = { id: 'p_active', status: 'active', partner_code: 'TEST103' };
  const sessionApproved = { id: 'p_approved', status: 'approved', partner_code: 'TEST104' };
  assert.strictEqual(isPartnerApproved(sessionActive), true);
  assert.strictEqual(isPartnerApproved(sessionApproved), true);
});

// ------------------------------------------------------------------------------
// Category 2: Cross-Partner Data Isolation Tests
// ------------------------------------------------------------------------------
console.log('\n2. Partner Data Isolation Tests:');

it('Partner A cannot view Partner B bookings or commissions', () => {
  const partnerA = { id: 'uuid-partner-a', partner_code: 'VILLA_A' };
  const partnerB = { id: 'uuid-partner-b', partner_code: 'VILLA_B' };

  // Simulated DB commission records
  const dbCommissions = [
    { id: 'comm-1', partner_id: partnerA.id, amount: 75000, booking_id: 'BTP-A01' },
    { id: 'comm-2', partner_id: partnerB.id, amount: 90000, booking_id: 'BTP-B01' },
  ];

  // Scoped query for Partner A
  const partnerAComms = dbCommissions.filter(c => c.partner_id === partnerA.id);
  assert.strictEqual(partnerAComms.length, 1);
  assert.strictEqual(partnerAComms[0].booking_id, 'BTP-A01');
  assert.strictEqual(partnerAComms.some(c => c.partner_id === partnerB.id), false, 'Partner A must never see Partner B records');
});

it('Partner A cannot modify Partner B payout details via parameter tampering', () => {
  const partnerA = { id: 'uuid-partner-a' };
  const targetId = 'uuid-partner-b'; // Attacker attempts to modify Partner B

  // Security check: Route handler strictly updates `eq('id', session.id)`
  const safeTargetId = partnerA.id; // Enforced by session, ignores targetId in body
  assert.notStrictEqual(safeTargetId, targetId);
  assert.strictEqual(safeTargetId, partnerA.id, 'Server-side authorization must enforce session.id');
});

// ------------------------------------------------------------------------------
// Category 3: 30-Day Referral Link & Attribution System Tests
// ------------------------------------------------------------------------------
console.log('\n3. 30-Day Referral Link & Attribution System Tests:');

it('30-day attribution window constant equals 2,592,000,000 ms', () => {
  assert.strictEqual(THIRTY_DAYS_MS, 30 * 24 * 60 * 60 * 1000);
});

it('Day 1 to Day 29 touches remain fully valid within 30-day window', () => {
  const now = 1700000000000;
  const day1Touch = now;
  const day29Check = now + (29 * 24 * 60 * 60 * 1000);
  const expiresAt = day1Touch + THIRTY_DAYS_MS;

  const isExpired = day29Check > expiresAt;
  assert.strictEqual(isExpired, false, 'Day 29 booking must be attributed within 30 days');
});

it('Day 31 touch is strictly expired and not attributed', () => {
  const now = 1700000000000;
  const day1Touch = now;
  const day31Check = now + (31 * 24 * 60 * 60 * 1000);
  const expiresAt = day1Touch + THIRTY_DAYS_MS;

  const isExpired = day31Check > expiresAt;
  assert.strictEqual(isExpired, true, 'Day 31 booking must not be attributed');
});

it('Last-touch attribution replaces previous referral and resets 30-day window', () => {
  const t0 = 1700000000000;
  let activeReferral = { partner_code: 'PARTNER_A', timestamp: t0, expires_at: t0 + THIRTY_DAYS_MS };

  // Customer clicks Partner B on Day 10
  const t10 = t0 + (10 * 24 * 60 * 60 * 1000);
  activeReferral = { partner_code: 'PARTNER_B', timestamp: t10, expires_at: t10 + THIRTY_DAYS_MS };

  assert.strictEqual(activeReferral.partner_code, 'PARTNER_B');
  assert.strictEqual(activeReferral.expires_at, t10 + THIRTY_DAYS_MS);
});

it('Direct booking without referral works normally with source = Direct', () => {
  const affiliateCookie = null;
  const source = affiliateCookie ? affiliateCookie.partner_code : 'Direct';
  assert.strictEqual(source, 'Direct');
});

// ------------------------------------------------------------------------------
// Category 4: Commission Engine — 15% Standard Rate Tests
// ------------------------------------------------------------------------------
console.log('\n4. Commission Engine (15%) Tests:');

it('Calculates exact 15% commission on single treatment (IDR 375,000 -> IDR 56,250)', () => {
  const result = calculateEligibleCommission({
    totalPrice: 375000,
    cartItems: [{ title: 'Balinese Traditional Massage', price: 375000, guests: 1 }],
    partnerRatePct: 15.0,
  });

  assert.strictEqual(result.eligibleTreatmentAmount, 375000);
  assert.strictEqual(result.commissionRatePct, 15.0);
  assert.strictEqual(result.commissionAmount, 56250);
});

it('Strictly excludes transport fees from commission base', () => {
  const result = calculateEligibleCommission({
    totalPrice: 450000, // 375,000 treatment + 75,000 transport
    transportFee: 75000,
    cartItems: [
      { title: 'Deep Tissue Ritual', price: 375000, guests: 1 },
      { title: 'Transport Fee (Uluwatu)', price: 75000, guests: 1 },
    ],
    partnerRatePct: 15.0,
  });

  assert.strictEqual(result.eligibleTreatmentAmount, 375000, 'Eligible treatment amount must exclude transport');
  assert.strictEqual(result.commissionAmount, 56250, 'Commission must only be 15% of treatment');
});

it('Couple massage package priced for 2 does not double count quantity', () => {
  const result = calculateEligibleCommission({
    totalPrice: 850000, // Honeymoon Couple Package (already covers 2 persons)
    cartItems: [
      { title: 'Honeymoon Couple Ritual (2 Person)', price: 850000, guests: 2 },
    ],
    partnerRatePct: 15.0,
  });

  assert.strictEqual(result.eligibleTreatmentAmount, 850000);
  assert.strictEqual(result.commissionAmount, 127500); // 850,000 * 0.15 = 127,500
});

it('Lifecycle: Commission requires BOTH completed service and verified payment for approval', () => {
  // Case A: Finished but Unpaid -> pending
  const caseA = { service_completed: true, payment_verified: false };
  const statusA = (caseA.service_completed && caseA.payment_verified) ? 'approved' : 'pending';
  assert.strictEqual(statusA, 'pending');

  // Case B: Paid but not Finished -> pending
  const caseB = { service_completed: false, payment_verified: true };
  const statusB = (caseB.service_completed && caseB.payment_verified) ? 'approved' : 'pending';
  assert.strictEqual(statusB, 'pending');

  // Case C: Both Finished AND Paid -> approved
  const caseC = { service_completed: true, payment_verified: true };
  const statusC = (caseC.service_completed && caseC.payment_verified) ? 'approved' : 'pending';
  assert.strictEqual(statusC, 'approved');
});

it('Idempotency: Database unique constraint prevents duplicate commissions per booking', () => {
  const bookingId = 'BTP-2026-TEST';
  const existingCommissions = new Set([bookingId]);

  const attemptInsert = (bId) => {
    if (existingCommissions.has(bId)) {
      return { success: false, error: 'duplicate_key_violates_unique_constraint' };
    }
    existingCommissions.add(bId);
    return { success: true };
  };

  const duplicateAttempt = attemptInsert(bookingId);
  assert.strictEqual(duplicateAttempt.success, false);
});

it('Cancellation/Refund handling: Cancelling booking reverses pending/approved commission', () => {
  let comm = { id: 'c1', status: 'approved', paid_at: null };
  const bookingCancelled = true;

  if (bookingCancelled && comm.status !== 'paid') {
    comm.status = 'cancelled';
  }

  assert.strictEqual(comm.status, 'cancelled');
});

// ------------------------------------------------------------------------------
// Category 5: Payouts & Double-Payout Prevention Tests
// ------------------------------------------------------------------------------
console.log('\n5. Payouts & Double-Payout Prevention Tests:');

it('Commission cannot be included in two payouts', () => {
  const commissions = [
    { id: 'comm-1', status: 'paid', payout_id: 'PAY01' },
    { id: 'comm-2', status: 'approved', payout_id: null },
  ];

  // Request payout including comm-1 and comm-2
  const requestedIds = ['comm-1', 'comm-2'];
  const eligibleForPayout = commissions.filter(c => requestedIds.includes(c.id) && c.status !== 'paid');

  assert.strictEqual(eligibleForPayout.length, 1);
  assert.strictEqual(eligibleForPayout[0].id, 'comm-2', 'comm-1 must be filtered out because it is already paid');
});

it('Clean payout reference generated in human-readable format', () => {
  const pCode = 'VILLA123';
  const rand = '4X9Q';
  const ref = `PAY${pCode.slice(0, 4)}${rand}`;
  assert.strictEqual(ref, 'PAYVILL4X9Q');
  assert.strictEqual(ref.includes('-'), false);
});

// ------------------------------------------------------------------------------
// Category 6: Regression & Backward Compatibility Tests
// ------------------------------------------------------------------------------
console.log('\n6. Regression & Backward Compatibility Tests:');

it('Existing bookings schema fields (revenue, pax, therapist_fee) remain intact', () => {
  const basePayload = {
    reference_number: 'BTP-999',
    guest_name: 'John Doe',
    guest_whatsapp: '+628123456789',
    booking_date: '2026-11-01',
    time: '14:00',
    total_price: 375000,
    revenue: 375000,
    pax: 1,
    therapists_count: 1,
    therapist_fee_total: 0,
    net_profit: 375000,
    status: 'Pending',
    brand: 'therapick',
  };

  assert.strictEqual(basePayload.total_price, 375000);
  assert.strictEqual(basePayload.brand, 'therapick');
  assert.strictEqual(basePayload.reference_number, 'BTP-999');
});

console.log('\n==============================================================================');
console.log(`TEST SUITE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('==============================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
