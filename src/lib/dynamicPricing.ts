/**
 * THERAPICK DYNAMIC PRICING UTILITIES
 * 
 * Centralized calculation engine for dynamic pricing adjustments.
 * Admin can set global rate percentage (e.g. -5% for discount, +5% for markup).
 * 
 * STRICT BUSINESS RULE:
 * Campaign card treatment options already have dedicated campaign discounts
 * and are strictly EXEMPT from global dynamic pricing adjustments.
 */

export interface DynamicPricingOption {
  duration: string;
  price: string;
  base_price?: string;
  net_price?: string | number;
}

/**
 * Calculates adjusted price based on dynamic pricing percentage.
 * @param basePrice - Base catalog price (number or string with commas/Rp)
 * @param dynamicPricingPercentage - Adjustment percentage (e.g. -5, 5, 0)
 * @param isCampaignOption - Whether this option belongs to a campaign card (exempt if true)
 * @returns number - Final calculated price rounded to nearest whole Rupiah
 */
export function calculateDynamicPrice(
  basePrice: number | string,
  dynamicPricingPercentage: number = 0,
  isCampaignOption: boolean = false
): number {
  const numericBase = typeof basePrice === 'string'
    ? parseInt(basePrice.replace(/[^0-9]/g, '') || '0', 10)
    : Number(basePrice) || 0;

  if (numericBase <= 0) return 0;

  // Campaign card treatment options are strictly exempt (already discounted)
  if (isCampaignOption || !dynamicPricingPercentage || dynamicPricingPercentage === 0) {
    return numericBase;
  }

  const multiplier = 1 + (dynamicPricingPercentage / 100);
  return Math.round(numericBase * multiplier);
}

/**
 * Adjusts an array of treatment options with dynamic pricing.
 * Preserves original base price in `base_price` field.
 */
export function adjustTreatmentOptions(
  options: DynamicPricingOption[] | undefined | null,
  dynamicPricingPercentage: number = 0,
  isCampaignOption: boolean = false
): DynamicPricingOption[] {
  if (!Array.isArray(options)) return [];

  return options.map(opt => {
    const rawPriceStr = String(opt.price || '0');
    const existingBaseStr = opt.base_price || rawPriceStr;
    const baseNumeric = parseInt(existingBaseStr.replace(/[^0-9]/g, '') || '0', 10);

    if (baseNumeric <= 0 || isCampaignOption || dynamicPricingPercentage === 0) {
      return {
        ...opt,
        price: String(baseNumeric),
        base_price: String(baseNumeric),
      };
    }

    const adjustedNumeric = calculateDynamicPrice(baseNumeric, dynamicPricingPercentage, false);

    return {
      ...opt,
      price: String(adjustedNumeric),
      base_price: String(baseNumeric),
    };
  });
}

/**
 * Helper to format IDR currency cleanly (e.g. "350,000")
 */
export function formatIdr(amount: number | string): string {
  const num = typeof amount === 'string'
    ? parseInt(amount.replace(/[^0-9]/g, '') || '0', 10)
    : Number(amount) || 0;
  return num.toLocaleString('en-US');
}

