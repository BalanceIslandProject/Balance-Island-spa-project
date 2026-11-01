'use client';

import React from 'react';
import { PayoutTab } from '@/types/payouts';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Receipt, 
  Scale, 
  Settings 
} from 'lucide-react';

interface PayoutsTabNavProps {
  activeTab: PayoutTab;
  onChangeTab: (tab: PayoutTab) => void;
  badgeCounts?: {
    readyPartners?: number;
    pendingRuns?: number;
    unreconciled?: number;
  };
}

export default function PayoutsTabNav({ activeTab, onChangeTab, badgeCounts }: PayoutsTabNavProps) {
  const tabs: { id: PayoutTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'earnings', label: 'Partner Earnings', icon: Users, badge: badgeCounts?.readyPartners },
    { id: 'runs', label: 'Payout Runs', icon: Layers, badge: badgeCounts?.pendingRuns },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'reconciliation', label: 'Reconciliation', icon: Scale, badge: badgeCounts?.unreconciled },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="border-b border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-2xs">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-100/70'
              }`}
            >
              <Icon 
                size={14} 
                className={isActive ? 'text-[#facc15]' : 'text-stone-400'} 
              />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive 
                    ? 'bg-neutral-800 text-[#facc15] border border-neutral-700' 
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
