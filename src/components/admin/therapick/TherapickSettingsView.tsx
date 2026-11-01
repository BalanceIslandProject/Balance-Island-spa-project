'use client';

import React, { useState } from 'react';
import { Settings, Shield, Bell, DollarSign, Clock, Check, Sparkles } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickSettingsView() {
  const { system } = useTherapickAdmin();
  const [commissionRate, setCommissionRate] = useState(15);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [autoApprovePartners, setAutoApprovePartners] = useState(false);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
          {system === 'website' ? 'Website System Settings' : 'Affiliate System Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Configure commission percentages, service operating windows, and system policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Affiliate Commission Rules */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-neutral-900">Partner Commission Model</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Standard Commission Rate (%)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={commissionRate}
                onChange={e => setCommissionRate(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 font-bold font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Therapick standard is fixed at 15% per verified booking.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Partner Application Policy
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={autoApprovePartners}
                  onChange={e => setAutoApprovePartners(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoApprove" className="text-xs text-stone-600 cursor-pointer">
                  Require manual admin verification for new partners (Recommended)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Window */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold text-neutral-900">In-Villa Operating Window</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Daily Opening Time</label>
              <input
                type="time"
                value={openingTime}
                onChange={e => setOpeningTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Daily Last Slot</label>
              <input
                type="time"
                value={closingTime}
                onChange={e => setClosingTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Realtime Notifications */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-neutral-900">Notification Dispatch</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={e => setNotifyWhatsApp(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              <span className="text-stone-700 font-medium">
                Dispatch automated WhatsApp confirmation upon therapist assignment
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              <span className="text-stone-700 font-medium">
                Notify partner on WhatsApp when commission balance becomes available
              </span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between">
          {saved ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Check size={14} />
              <span>Settings successfully updated!</span>
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
