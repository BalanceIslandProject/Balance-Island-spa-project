'use client';

import React from 'react';
import { PayoutTab } from '@/types/payouts';
import { 
  LayoutDashboard, 
  Receipt, 
  Calendar, 
  Settings 
} from 'lucide-react';

interface PayoutsTabNavProps {
  activeTab: PayoutTab;
  onChangeTab: (tab: PayoutTab) => void;
  counts?: {
    unpaidCount?: number;
    paymentsCount?: number;
  };
}

export default function PayoutsTabNav({ activeTab, onChangeTab, counts }: PayoutsTabNavProps) {
  const tabs: { id: PayoutTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'history', label: 'Payment History', icon: Receipt, count: counts?.paymentsCount },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-white rounded-2xl p-1.5 border border-stone-200/90 shadow-2xs">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#facc15] text-neutral-950 shadow-2xs border border-amber-300'
                  : 'bg-transparent text-stone-600 hover:text-neutral-900 hover:bg-stone-100 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-neutral-950' : 'text-stone-400'} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-neutral-950 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
