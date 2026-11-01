export type PayoutTab = 
  | 'overview' 
  | 'earnings' 
  | 'runs' 
  | 'transactions' 
  | 'reconciliation' 
  | 'settings';

export type PayoutRunStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'partially_completed'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PayoutRunItem {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  business_name?: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  amount: number;
  commission_ids: string[];
  booking_count: number;
  status: 'pending' | 'completed' | 'failed';
  transfer_reference?: string;
  failure_reason?: string;
}

export interface PayoutRun {
  id: string;
  run_reference: string; // e.g. PR-2026-W45
  created_at: string;
  scheduled_date: string; // e.g. 2026-11-05
  cycle_interval: '7_days'; // strictly 7 days
  total_amount: number;
  partner_count: number;
  payment_method: 'bank_transfer';
  status: PayoutRunStatus;
  approved_by?: string;
  approved_at?: string;
  executed_at?: string;
  bank_batch_reference?: string;
  notes?: string;
  items: PayoutRunItem[];
}

export type TransactionType = 
  | 'commission_earned'
  | 'payout_disbursed'
  | 'refund_adjustment'
  | 'commission_reversal'
  | 'manual_adjustment';

export type TransactionStatus = 
  | 'cleared'
  | 'pending'
  | 'reconciled'
  | 'failed';

export interface PayoutTransaction {
  id: string; // TXN-XXXX
  timestamp: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  booking_reference?: string;
  type: TransactionType;
  direction: 'credit' | 'debit';
  amount: number;
  status: TransactionStatus;
  notes?: string;
  reference_id?: string; // payout id or commission id
  bank_reference?: string;
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
  payment_method: 'bank_transfer';
  notifications: {
    upcoming_run_reminder: boolean;
    batch_approval_alert: boolean;
    transfer_status_alert: boolean;
  };
}

export interface ReconciliationItem {
  id: string;
  payout_id: string;
  payout_reference: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  disbursed_at: string;
  amount: number;
  bank_reference: string;
  is_reconciled: boolean;
  reconciled_at?: string;
  notes?: string;
  status: 'reconciled' | 'pending_ref' | 'failed';
}
