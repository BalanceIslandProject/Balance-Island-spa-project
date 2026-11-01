export type PayoutTab = 
  | 'overview' 
  | 'history' 
  | 'calendar' 
  | 'settings';

export type PaymentMethod = 
  | 'Bank Transfer (BCA)'
  | 'Bank Transfer (Mandiri)'
  | 'Bank Transfer (BNI)'
  | 'Other Bank'
  | 'Cash'
  | 'Other';

export interface PartnerPayoutRow {
  id: string; // partner id
  name: string;
  business_name?: string;
  partner_code: string;
  referral_code?: string;
  avatar_url?: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  joined_date?: string;
  earned: number;
  paid: number;
  unpaid: number;
  next_payout_date: string; // YYYY-MM-DD
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  commission_count: number;
  payment_count: number;
}

export interface PaymentRecord {
  id: string; // PAY-2026-XXXX
  date: string; // YYYY-MM-DD
  partner_id: string;
  partner_name: string;
  partner_business?: string;
  amount: number;
  method: string;
  reference: string;
  status: 'Recorded';
  notes?: string;
  receipt_url?: string;
  created_at: string;
  created_by?: string;
}

export interface CommissionCalendarDayEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'commission_earned' | 'scheduled_payout' | 'payment_recorded';
  partner_id?: string;
  partner_name?: string;
  booking_id?: string;
  booking_reference?: string;
  treatment_name?: string;
  amount: number;
  status?: string;
  notes?: string;
}

export interface PayoutWeeklyScheduleConfig {
  enabled: boolean;
  frequency: 'weekly_7_days'; // strictly locked to weekly every 7 days
  first_payout_date: string; // YYYY-MM-DD
  next_scheduled_date: string; // YYYY-MM-DD
  weekly_cutoff_time: string; // e.g. '23:59'
  timezone: string; // strictly 'Asia/Makassar'
  min_payout_threshold: number; // default 100000
  manual_approval_required: boolean;
  default_commission_rate_pct: number; // default 15
  payment_methods: string[];
}
