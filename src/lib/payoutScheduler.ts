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
  payment_method: 'bank_transfer',
  notifications: {
    upcoming_run_reminder: true,
    batch_approval_alert: true,
    transfer_status_alert: true,
  },
};

const STORAGE_KEY = 'therapick_payout_schedule_config_v2';

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
      frequency: 'weekly_7_days', // enforce fixed 7-day frequency
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
    // Strictly preserve 7-day rule
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

export interface UpcomingCycle {
  cycleIndex: number;
  reference: string;
  dateStr: string;
  formattedDate: string;
  dayOfWeek: string;
  cutoffTime: string;
  status: 'active' | 'upcoming';
}

/**
 * Returns a list of upcoming 7-day cycles (strictly 7-day intervals)
 */
export function getUpcomingWeeklyCycles(config: PayoutWeeklyScheduleConfig, count = 5): UpcomingCycle[] {
  const nextDate = calculateNextScheduledDate(config.first_payout_date);
  const cycles: UpcomingCycle[] = [];

  let curDateStr = nextDate;
  const now = new Date();
  const year = now.getFullYear();

  for (let i = 1; i <= count; i++) {
    const [y, m, d] = curDateStr.split('-').map(Number);
    const dObj = new Date(y, m - 1, d);

    // Compute approximate week number for reference
    const firstJan = new Date(y, 0, 1);
    const daysSince = Math.floor((dObj.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((daysSince + firstJan.getDay() + 1) / 7);

    const formattedDate = dObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    });

    const dayOfWeek = dObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      timeZone: 'Asia/Makassar',
    });

    cycles.push({
      cycleIndex: i,
      reference: `PR-${y}-W${String(weekNum).padStart(2, '0')}`,
      dateStr: curDateStr,
      formattedDate,
      dayOfWeek,
      cutoffTime: `${config.weekly_cutoff_time || '23:59'} WITA`,
      status: i === 1 ? 'active' : 'upcoming',
    });

    // Strictly advance by exactly 7 calendar days
    curDateStr = addDays(curDateStr, 7);
  }

  return cycles;
}

/**
 * IDR Currency Formatter
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

/**
 * Advances the schedule config to the next 7-day cycle
 */
export function advanceToNextCycle(config: PayoutWeeklyScheduleConfig): PayoutWeeklyScheduleConfig {
  const currentNext = config.next_scheduled_date || config.first_payout_date;
  const newNext = addDays(currentNext, 7);
  return {
    ...config,
    next_scheduled_date: newNext,
  };
}

