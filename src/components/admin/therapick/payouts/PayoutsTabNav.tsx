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
    <div className="fitlo-sides !p-1 inline-flex max-w-full overflow-x-auto no-scrollbar">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`!h-9 !px-4 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              isActive ? 'is-active !font-bold' : ''
            }`}
          >
            <Icon size={14} className={isActive ? 'text-[#0b7a73]' : 'text-[var(--fitlo-muted)]'} />
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-[#0b7a73] text-white' : 'bg-[var(--fitlo-card-3)] text-[var(--fitlo-muted)]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
