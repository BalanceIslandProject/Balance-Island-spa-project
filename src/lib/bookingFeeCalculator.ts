/**
 * Therapick & Elexoir Booking Fee Calculator
 * Automatically calculates therapist fee based on database records and business rules:
 * - Packages, couple massages, and 4-hand massages require 2 therapists (multiplier = 2).
 * - Standard single massages require 1 therapist (multiplier = 1).
 * - Multiple pax / guest bookings scale proportionally (multiplier = pax).
 */

export interface FeeCalculationResult {
  feeTotal: number;
  baseFee: number;
  multiplier: number;
  isDoubleTherapist: boolean;
  reason: string;
}

export function normDurationDigits(duration: any): string {
  const digits = String(duration || '').replace(/[^0-9]/g, '');
  return digits || '90';
}

export function isCoupleOrPackageOrFourHands(
  treatmentName: string,
  pax?: number,
  therapistsCount?: number,
  guests?: number
): { isDouble: boolean; multiplier: number; reason: string } {
  const name = String(treatmentName || '').toLowerCase().trim();

  const isFourHands = /four\s*hands?|4\s*hands?|four-hands?|4-hands?/i.test(name);
  const isCouple = /couple|honeymoon|romantic|duo|twin/i.test(name);
  const isPackage = /package|ritual|purification|rejuvenation/i.test(name);
  const hasMultiplePax = (Number(pax) >= 2) || (Number(therapistsCount) >= 2) || (Number(guests) >= 2);

  const isDouble = isFourHands || isCouple || isPackage || hasMultiplePax;
  const count = Math.max(
    isDouble ? 2 : 1,
    Number(pax) || 0,
    Number(therapistsCount) || 0,
    Number(guests) || 0
  );

  let reason = '1 Therapist (Single)';
  if (isFourHands) {
    reason = '2 Therapists (Four Hands)';
  } else if (isCouple) {
    reason = '2 Therapists (Couple)';
  } else if (isPackage) {
    reason = '2 Therapists (Package)';
  } else if (hasMultiplePax) {
    reason = `${count} Therapists (${count} Persons)`;
  }

  return { isDouble, multiplier: count, reason };
}

export function calculateBookingTherapistFee(
  booking: any,
  therapistFees: any[] = [],
  treatments: any[] = []
): FeeCalculationResult {
  if (!booking) {
    return { feeTotal: 0, baseFee: 0, multiplier: 1, isDoubleTherapist: false, reason: '' };
  }

  try {
    const safeTreatments = Array.isArray(treatments) ? treatments : [];
    const safeFees = Array.isArray(therapistFees) ? therapistFees : [];

    const treatmentName = String(
      booking.treatment_name ||
      booking.items?.[0]?.title ||
      booking.service_name ||
      ''
    ).trim();

    const { isDouble, multiplier, reason } = isCoupleOrPackageOrFourHands(
      treatmentName,
      booking.pax,
      booking.therapists_count,
      booking.items?.[0]?.guests
    );

    // Helper to resolve fee for a duration and treatment
    const resolveBaseFee = (tId: string | undefined, title: string, durStr: string): number => {
      const dur = normDurationDigits(durStr);
      const normTitle = String(title || '').toLowerCase().trim();

      // 1. Try to find treatment in treatments table
      const matchedTreatment = safeTreatments.find(t => 
        (tId && t?.id === tId) ||
        (t?.title && t.title.toLowerCase().trim() === normTitle) ||
        (t?.title && normTitle.includes(t.title.toLowerCase().trim())) ||
        (t?.title && t.title.toLowerCase().trim().includes(normTitle))
      );

      const targetTreatmentId = matchedTreatment?.id || tId;

      // 2. Exact match in therapistFees: treatmentId + duration
      let feeObj = safeFees.find(f => 
        targetTreatmentId && 
        f?.treatment_id === targetTreatmentId && 
        normDurationDigits(f?.duration) === dur
      );

      // 3. Match in therapistFees by treatmentId alone
      if (!feeObj && targetTreatmentId) {
        feeObj = safeFees.find(f => f?.treatment_id === targetTreatmentId);
      }

      // 4. Match in therapistFees by title match and duration
      if (!feeObj && matchedTreatment) {
        feeObj = safeFees.find(f => 
          normDurationDigits(f?.duration) === dur && 
          (f?.brand === 'therapick' || !f?.brand)
        );
      }

      // 5. Match by duration alone across therapistFees
      if (!feeObj) {
        feeObj = safeFees.find(f => normDurationDigits(f?.duration) === dur);
      }

      if (feeObj && feeObj.fee) {
        const parsed = parseInt(String(feeObj.fee).replace(/[^0-9]/g, '') || '0', 10);
        if (parsed > 0) return parsed;
      }

      // Fallback standard tiered fees
      const numDur = Number(dur) || 90;
      const isPkg = /package|ritual|purification|rejuvenation/i.test(normTitle);
      if (numDur <= 30) return 75000;
      if (numDur <= 60) return 150000;
      if (numDur <= 90) return 225000;
      if (numDur <= 120) return isPkg ? 375000 : 300000;
      return 435000;
    };

    // Check if booking has items array (array or parsed JSON)
    let items: any[] | null = null;
    if (Array.isArray(booking.items) && booking.items.length > 0) {
      items = booking.items;
    } else if (typeof booking.items === 'string') {
      try {
        const parsed = JSON.parse(booking.items);
        if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
      } catch {}
    }

    if (items) {
      let sumTotal = 0;
      let primaryBaseFee = 0;

      for (const item of items) {
        if (!item) continue;
        const itemTitle = String(item.title || treatmentName).trim();
        const dur = item.duration || booking.duration_minutes || '90';
        const base = resolveBaseFee(item.treatmentId, itemTitle, dur);
        if (primaryBaseFee === 0) primaryBaseFee = base;

        const itemInfo = isCoupleOrPackageOrFourHands(
          itemTitle,
          item.guests || booking.pax,
          booking.therapists_count,
          item.guests
        );

        sumTotal += base * itemInfo.multiplier;
      }

      if (sumTotal > 0) {
        return {
          feeTotal: sumTotal,
          baseFee: primaryBaseFee,
          multiplier,
          isDoubleTherapist: isDouble,
          reason
        };
      }
    }

    // Single treatment calculation
    const dur = booking.duration_minutes || '90';
    const baseFee = resolveBaseFee(booking.treatment_id, treatmentName, dur);
    const feeTotal = baseFee * multiplier;

    return {
      feeTotal,
      baseFee,
      multiplier,
      isDoubleTherapist: isDouble,
      reason
    };
  } catch (err) {
    console.error('Error calculating therapist fee:', err);
    return {
      feeTotal: 150000,
      baseFee: 150000,
      multiplier: 1,
      isDoubleTherapist: false,
      reason: '1 Therapist (Fallback)'
    };
  }
}
