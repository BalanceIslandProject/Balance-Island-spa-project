'use client';

import React, { useState } from 'react';
import { 
  Percent, 
  Calendar, 
  Clock, 
  Wallet, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate } from '@/lib/payoutScheduler';

interface PayoutsSettingsTabProps {
  config: PayoutWeeklyScheduleConfig;
  onSaveConfig: (updated: PayoutWeeklyScheduleConfig) => Promise<void>;
}

export default function PayoutsSettingsTab({
  config,
  onSaveConfig
}: PayoutsSettingsTabProps) {
  const [formData, setFormData] = useState<PayoutWeeklyScheduleConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl animate-in fade-in duration-200">
      
      {/* Top Header & Save Button */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div>
          <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">Payout &amp; Commission Settings</h3>
          <p className="text-xs text-stone-500">Configure recurring 7-day disbursement schedules and payment defaults.</p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save size={14} className="text-amber-400" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Commission Configuration */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Percent size={16} className="text-amber-600" />
            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Default Affiliate Commission</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Standard Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.default_commission_rate_pct}
                  onChange={e => setFormData({ ...formData, default_commission_rate_pct: Number(e.target.value) })}
                  className="w-full text-sm font-extrabold font-mono bg-stone-50 border border-stone-200 rounded-xl p-2.5 pr-8 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-500 leading-relaxed">
              Applied automatically to completed reservations attributed to registered affiliate partners. Historical records maintain their locked rate.
            </div>
          </div>
        </div>

        {/* Card 2: Fixed 7-Day Weekly Schedule */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Weekly 7-Day Cycle</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
              Locked (Every 7 Days)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Cutoff Time
                </label>
                <input
                  type="text"
                  value={formData.weekly_cutoff_time}
                  onChange={e => setFormData({ ...formData, weekly_cutoff_time: e.target.value })}
                  className="w-full text-xs font-bold font-mono bg-stone-50 border border-stone-200 rounded-xl p-2 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  disabled
                  value="Asia/Makassar (WITA)"
                  className="w-full text-xs font-bold font-mono bg-stone-100 border border-stone-200 rounded-xl p-2 text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-500 leading-relaxed">
              Therapick adheres strictly to a 7-day recurring cycle. Daily, bi-weekly, or monthly intervals are disabled to preserve operational consistency.
            </div>
          </div>
        </div>

        {/* Card 3: Minimum Payout Threshold */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Wallet size={16} className="text-emerald-700" />
            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Minimum Threshold &amp; Rollover</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Minimum Payout Threshold (IDR)
              </label>
              <input
                type="number"
                step="10000"
                min="50000"
                value={formData.min_payout_threshold}
                onChange={e => setFormData({ ...formData, min_payout_threshold: Number(e.target.value) })}
                className="w-full text-sm font-extrabold font-mono bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Current Threshold: <strong>{formatIDR(formData.min_payout_threshold)}</strong>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-500 leading-relaxed">
              If an affiliate has an unpaid commission balance below this amount, it carries forward into the subsequent 7-day payout cycle automatically.
            </div>
          </div>
        </div>

        {/* Card 4: Supported Payment Methods */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <CreditCard size={16} className="text-stone-700" />
            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Payment Methods</h4>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-[11px] text-stone-500 block">
              Configured options available in the <strong>Record Payment</strong> form:
            </span>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.payment_methods.map(method => (
                <span 
                  key={method}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold"
                >
                  {method}
                </span>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-500 leading-relaxed mt-2">
              All transfers are manually conducted by authorized administrators via corporate Indonesian banking portals or verified cash disbursements.
            </div>
          </div>
        </div>

      </div>

    </form>
  );
}
