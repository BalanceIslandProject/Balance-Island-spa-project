import { PayoutWeeklyScheduleConfig } from '@/types/payouts';

export const DEFAULT_PAYOUT_CONFIG: PayoutWeeklyScheduleConfig = {
  enabled: true,
  frequency: 'weekly_7_days',
  first_payout_date: '2026-11-05',
  next_scheduled_date: '2026-11-05',
  weekly_cutoff_time: '23:59',
  timezone: 'Asia/Makassar',
  min_payout_threshold: 100000, // IDR 100,000
  manual_approval_required: true,
  default_commission_rate_pct: 15,
  payment_methods: [
    'Bank Transfer (BCA)',
    'Bank Transfer (Mandiri)',
    'Bank Transfer (BNI)',
    'Other Bank',
    'Cash',
    'Other'
  ],
};

const STORAGE_KEY = 'therapick_payout_schedule_config_v3';

/**
 * Load payout configuration from localStorage or default
 */
export function loadPayoutConfig(): PayoutWeeklyScheduleConfig {
  if (typeof window === 'undefined') return DEFAULT_PAYOUT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PAYOUT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PAYOUT_CONFIG,
      ...parsed,
      frequency: 'weekly_7_days', // strictly enforce 7-day recurring cycle
      timezone: 'Asia/Makassar',
    };
  } catch {
    return DEFAULT_PAYOUT_CONFIG;
  }
}

/**
 * Save payout configuration
 */
export function savePayoutConfig(config: PayoutWeeklyScheduleConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const validated: PayoutWeeklyScheduleConfig = {
      ...config,
      frequency: 'weekly_7_days',
      timezone: 'Asia/Makassar',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (e) {
    console.error('Failed to save payout config:', e);
  }
}

/**
 * Add exactly N days to a date string YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  } catch {
    return dateStr;
  }
}

/**
 * Calculates the next active 7-day scheduled date starting from first_payout_date
 */
export function calculateNextScheduledDate(firstPayoutDateStr: string, refDate = new Date()): string {
  try {
    let current = firstPayoutDateStr;
    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 100; i++) {
      const [y, m, d] = current.split('-').map(Number);
      const curDate = new Date(y, m - 1, d);
      curDate.setHours(23, 59, 59, 999);

      if (curDate.getTime() >= today.getTime()) {
        return current;
      }
      current = addDays(current, 7);
    }
    return current;
  } catch {
    return firstPayoutDateStr;
  }
}

/**
 * Format Indonesian Rupiah e.g. Rp 210.000
 */
export function formatIDR(val: number | string | undefined | null): string {
  const num = Number(val) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * Formats date into British / Indonesian standard (e.g. 5 Nov 2026)
 */
export function formatWitaDate(dateVal?: string | Date | null): string {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Formats date with time (e.g. 5 Nov 2026, 14:30 WITA)
 */
export function formatWitaDateTime(dateVal?: string | Date | null): string {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dateStr = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    });
    const timeStr = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
    });
    return `${dateStr}, ${timeStr} WITA`;
  } catch {
    return String(dateVal);
  }
}
