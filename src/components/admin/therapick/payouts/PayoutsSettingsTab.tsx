'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Bell, 
  Check, 
  AlertCircle, 
  Layers, 
  Percent, 
  DollarSign, 
  Lock,
  Save,
  Wallet
} from 'lucide-react';
import { PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, getUpcomingWeeklyCycles, formatWitaDate, calculateNextScheduledDate } from '@/lib/payoutScheduler';

interface PayoutsSettingsTabProps {
  config: PayoutWeeklyScheduleConfig;
  onSaveConfig: (newConfig: PayoutWeeklyScheduleConfig) => Promise<void>;
}

export default function PayoutsSettingsTab({ config, onSaveConfig }: PayoutsSettingsTabProps) {
  const [formData, setFormData] = useState<PayoutWeeklyScheduleConfig>({ ...config });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Recalculate upcoming cycles live based on form inputs
  const upcomingCycles = getUpcomingWeeklyCycles(formData, 5);
  const calculatedNext = calculateNextScheduledDate(formData.first_payout_date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedConfig: PayoutWeeklyScheduleConfig = {
        ...formData,
        frequency: 'weekly_7_days', // strictly enforce 7-day rule
        timezone: 'Asia/Makassar',
        next_scheduled_date: calculatedNext,
      };
      await onSaveConfig(updatedConfig);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div>
          <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">
            Payout & Settlement Policy Settings
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure the mandatory weekly 7-day payout schedule, minimum payout thresholds, and approval policies.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving Settings...</span>
          ) : isSaved ? (
            <>
              <Check size={14} className="text-[#facc15]" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>Save Payout Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of 6 Setting Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CARD A: Weekly Schedule (Fixed 7 Days) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-neutral-900">A. Weekly Schedule (Fixed 7-Day Cycle)</h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
              <Lock size={10} /> Locked 7-Day Cadence
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Enable Schedule Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <span className="font-bold text-neutral-900 block">Automatic Weekly Scheduling</span>
                <span className="text-[11px] text-stone-500">Calculate batches every 7 calendar days</span>
              </div>
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            {/* First Payout Date & Cutoff Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 font-mono uppercase">
                  First Payout Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.first_payout_date}
                  onChange={e => setFormData({ ...formData, first_payout_date: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 font-mono uppercase">
                  Weekly Cutoff Time (WITA)
                </label>
                <input
                  type="time"
                  required
                  value={formData.weekly_cutoff_time}
                  onChange={e => setFormData({ ...formData, weekly_cutoff_time: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Timezone (Fixed to Asia/Makassar) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-600">
              <span className="font-mono text-[11px]">System Timezone</span>
              <span className="font-bold text-neutral-900 font-mono text-xs">Asia/Makassar (WITA, UTC+8)</span>
            </div>

            {/* Upcoming 5-Cycle Schedule Preview Table */}
            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase font-bold text-stone-400 block mb-1.5">
                Calculated 7-Day Cycle Preview (Next 5 Runs):
              </span>
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden font-mono text-[11px]">
                {upcomingCycles.map((c, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-stone-50/40">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">{c.reference}</span>
                      <span className="text-[10px] text-stone-500">({c.dayOfWeek})</span>
                    </div>
                    <span className="font-bold text-neutral-900">{c.formattedDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CARD B: Commission Settings */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Percent size={16} className="text-stone-600" />
              <h3 className="text-sm font-bold text-neutral-900">B. Commission Rate Configuration</h3>
            </div>
            <span className="text-[10px] font-mono text-stone-400">OTA Standard</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Default Affiliate Commission Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={formData.default_commission_rate_pct}
                  onChange={e => setFormData({ ...formData, default_commission_rate_pct: Number(e.target.value) })}
                  className="w-full text-sm font-bold bg-white border border-stone-200 rounded-xl p-2.5 pr-8 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">%</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-stone-600 leading-relaxed text-[11px] space-y-1">
              <p className="font-bold text-neutral-900">Historical Rate Integrity Policy:</p>
              <p>
                Modifications to the default commission rate apply strictly to new bookings. Previously attributed bookings preserve their locked rate to maintain immutable financial records.
              </p>
            </div>
          </div>
        </div>

        {/* CARD C: Minimum Payout Threshold & Rollover */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-emerald-700" />
              <h3 className="text-sm font-bold text-neutral-900">C. Minimum Payout Threshold & Rollover</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Minimum Payout Threshold (IDR)
              </label>
              <input
                type="number"
                step="10000"
                min="50000"
                value={formData.min_payout_threshold}
                onChange={e => setFormData({ ...formData, min_payout_threshold: Number(e.target.value) })}
                className="w-full text-sm font-bold bg-white border border-stone-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Current Threshold: {formatIDR(formData.min_payout_threshold)}
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={13} className="text-amber-700" />
                Automatic Balance Rollover:
              </p>
              <p>
                If a partner’s approved commission total is below {formatIDR(formData.min_payout_threshold)} at the weekly cutoff, their balance is not forfeited. It rolls over automatically to subsequent 7-day cycles until the threshold is met.
              </p>
            </div>
          </div>
        </div>

        {/* CARD D: Payment Method Configuration */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-stone-600" />
              <h3 className="text-sm font-bold text-neutral-900">D. Payment Method & Indonesian Banking</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              IDR Bank Transfer
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">Supported Domestic Banks</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Bank Permata'].map(b => (
                  <span key={b} className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-mono font-bold text-neutral-900 text-[11px]">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-[11px] text-stone-600 space-y-1">
              <p className="font-bold text-neutral-900">Security Verification Protocol:</p>
              <p>
                Transfers require matching the registered partner name with the bank account holder to prevent unauthorized disbursements.
              </p>
            </div>
          </div>
        </div>

        {/* CARD E: Approval Policy */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-700" />
              <h3 className="text-sm font-bold text-neutral-900">E. Authorization & Approval Policy</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <span className="font-bold text-neutral-900 block">Manual Admin Approval Required</span>
                <span className="text-[11px] text-stone-500">Require authorized administrator sign-off before execution</span>
              </div>
              <input
                type="checkbox"
                checked={formData.manual_approval_required}
                onChange={e => setFormData({ ...formData, manual_approval_required: e.target.checked })}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-[11px] text-stone-600 space-y-1">
              <p className="font-bold text-neutral-900">Two-Step Execution Separation:</p>
              <p>
                Approval authorizes the batch. Execution confirms the bank transfer reference. This strictly prevents accidental or unconfirmed bank disbursements.
              </p>
            </div>
          </div>
        </div>

        {/* CARD F: Notifications */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-stone-600" />
              <h3 className="text-sm font-bold text-neutral-900">F. Notification Triggers</h3>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.upcoming_run_reminder}
                onChange={e => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, upcoming_run_reminder: e.target.checked }
                })}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400"
              />
              <span className="text-neutral-900">Upcoming payout run reminder (24h before cutoff)</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.batch_approval_alert}
                onChange={e => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, batch_approval_alert: e.target.checked }
                })}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400"
              />
              <span className="text-neutral-900">New batch awaiting authorization alert</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.transfer_status_alert}
                onChange={e => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, transfer_status_alert: e.target.checked }
                })}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400"
              />
              <span className="text-neutral-900">Successful or failed transfer status alerts</span>
            </label>
          </div>
        </div>

      </div>

    </form>
  );
}
