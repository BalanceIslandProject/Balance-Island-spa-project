'use client';

import React from 'react';
import { Globe, Users, Info } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickSystemSwitcher() {
  const { system, setSystem, activeTab, setActiveTab } = useTherapickAdmin();

  const handleSwitch = (newSystem: 'website' | 'affiliate') => {
    if (newSystem === system) return;
    setSystem(newSystem);

    // If currently on an affiliate-only tab and switching to website, switch to overview
    if (newSystem === 'website' && ['partners', 'commission', 'payouts'].includes(activeTab)) {
      setActiveTab('overview');
    }
    // If currently on a website-only tab and switching to affiliate, switch to overview
    if (newSystem === 'affiliate' && ['therapists', 'services', 'customers', 'revenue', 'payments'].includes(activeTab)) {
      setActiveTab('overview');
    }
  };

  return (
    <div className="w-full bg-white border-b border-stone-200/80 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between select-none shadow-2xs z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-stone-500 font-sans tracking-tight">System</span>
        
        {/* Switcher Pill Container */}
        <div className="inline-flex items-center p-1 bg-stone-100 rounded-full border border-stone-200/70 shadow-2xs">
          {/* Website Option */}
          <button
            type="button"
            onClick={() => handleSwitch('website')}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              system === 'website'
                ? 'bg-[#FACC15] text-neutral-950 shadow-xs ring-1 ring-amber-400/30'
                : 'text-stone-600 hover:text-neutral-950 hover:bg-stone-200/60'
            }`}
          >
            <Globe size={14} className={system === 'website' ? 'text-neutral-950' : 'text-stone-500'} />
            <span>Website</span>
          </button>

          {/* Affiliate Option */}
          <button
            type="button"
            onClick={() => handleSwitch('affiliate')}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              system === 'affiliate'
                ? 'bg-[#FACC15] text-neutral-950 shadow-xs ring-1 ring-amber-400/30'
                : 'text-stone-600 hover:text-neutral-950 hover:bg-stone-200/60'
            }`}
          >
            <Users size={14} className={system === 'affiliate' ? 'text-neutral-950' : 'text-stone-500'} />
            <span>Affiliate</span>
          </button>
        </div>

        {/* Info Tooltip */}
        <div className="relative group flex items-center">
          <Info size={14} className="text-stone-400 hover:text-stone-600 cursor-pointer transition-colors" />
          <div className="hidden group-hover:block absolute left-0 top-full mt-2 w-72 p-3 bg-neutral-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95">
            <div className="font-bold mb-1 text-amber-300">Independent Operations:</div>
            Switch between direct <b>Website</b> direct bookings & revenue, and the <b>Affiliate</b> partner network & commission ledger without mixing financial data.
          </div>
        </div>
      </div>

      {/* System Status Indicator */}
      <div className="hidden md:flex items-center gap-2 text-xs text-stone-600 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-neutral-900 capitalize">{system} System</span>
        <span className="text-stone-400">·</span>
        <span className="text-stone-500">
          {system === 'website' ? 'Direct Bookings & Revenue' : 'Partner Network & Commissions'}
        </span>
      </div>
    </div>
  );
}
