'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, CalendarDays, Calendar, Users, Layers, 
  TrendingUp, Wallet, FileText, Settings, User, Receipt, Sparkles, DollarSign 
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

interface NavItemDef {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
}

export default function TherapickSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { system, activeTab, setActiveTab } = useTherapickAdmin();

  const currentTab = searchParams.get('tab') || (pathname === '/admin/bookings' ? 'bookings' : pathname === '/admin/partners' ? 'partners' : pathname === '/admin/commissions' ? 'commission' : pathname === '/admin/payouts' ? 'payouts' : pathname === '/admin/settings' ? 'settings' : 'overview');

  // Website System Navigation (10 Items)
  const websitePrimaryItems: NavItemDef[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'therapists', label: 'Therapist Fee', icon: DollarSign, href: '/admin?brand=therapick&tab=therapists' },
    { id: 'services', label: 'Services', icon: Layers, href: '/admin?brand=therapick&tab=services' },
    { id: 'customers', label: 'Customers', icon: Users, href: '/admin?brand=therapick&tab=customers' },
    { id: 'revenue', label: 'Revenue & Profit', icon: TrendingUp, href: '/admin?brand=therapick&tab=revenue' },
    { id: 'payments', label: 'Payments', icon: Wallet, href: '/admin?brand=therapick&tab=payments' },
  ];

  // Affiliate System Navigation (8 Items)
  const affiliatePrimaryItems: NavItemDef[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'partners', label: 'Partners', icon: Users, href: '/admin?brand=therapick&tab=partners' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'commission', label: 'Commission', icon: Receipt, href: '/admin?brand=therapick&tab=commission' },
    { id: 'payouts', label: 'Payouts', icon: Wallet, href: '/admin?brand=therapick&tab=payouts' },
  ];

  const secondaryItems: NavItemDef[] = [
    { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?brand=therapick&tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin?brand=therapick&tab=settings' },
  ];

  const primaryItems = system === 'website' ? websitePrimaryItems : affiliatePrimaryItems;

  const handleNavClick = (item: NavItemDef) => {
    setActiveTab(item.id);
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 lg:w-64 shrink-0 bg-[#0F172A] text-slate-300 p-4 select-none sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar border-r border-slate-800">
      
      {/* System Indicator Pill in Sidebar */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800/80">
          <span>{system === 'website' ? 'Website Portal' : 'Affiliate Portal'}</span>
          <span className="w-2 h-2 rounded-full bg-[#facc15]" />
        </div>
      </div>

      {/* Primary Items */}
      <div className="space-y-1">
        {primaryItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleNavClick(item)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E293B] text-white shadow-xs font-bold border-l-2 border-[#facc15]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#facc15]' : 'text-slate-400'} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Separator */}
      <div className="my-4 border-t border-slate-800" />

      {/* Secondary Items (Reports & Settings) */}
      <div className="space-y-1">
        {secondaryItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleNavClick(item)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E293B] text-white shadow-xs font-bold border-l-2 border-[#facc15]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#facc15]' : 'text-slate-400'} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 px-2 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center justify-between">
          <span>Therapick OS</span>
          <span className="text-[#facc15] font-bold">v2.6</span>
        </div>
      </div>
    </aside>
  );
}

export function TherapickMobileDrawerLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { system, setActiveTab } = useTherapickAdmin();

  const currentTab = searchParams.get('tab') || (pathname === '/admin/bookings' ? 'bookings' : pathname === '/admin/partners' ? 'partners' : pathname === '/admin/commissions' ? 'commission' : pathname === '/admin/payouts' ? 'payouts' : pathname === '/admin/settings' ? 'settings' : 'overview');

  const websitePrimaryItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'therapists', label: 'Therapist Fee', icon: DollarSign, href: '/admin?brand=therapick&tab=therapists' },
    { id: 'services', label: 'Services', icon: Layers, href: '/admin?brand=therapick&tab=services' },
    { id: 'customers', label: 'Customers', icon: Users, href: '/admin?brand=therapick&tab=customers' },
    { id: 'revenue', label: 'Revenue & Profit', icon: TrendingUp, href: '/admin?brand=therapick&tab=revenue' },
    { id: 'payments', label: 'Payments', icon: Wallet, href: '/admin?brand=therapick&tab=payments' },
  ];

  const affiliatePrimaryItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'partners', label: 'Partners', icon: Users, href: '/admin?brand=therapick&tab=partners' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'commission', label: 'Commission', icon: Receipt, href: '/admin?brand=therapick&tab=commission' },
    { id: 'payouts', label: 'Payouts', icon: Wallet, href: '/admin?brand=therapick&tab=payouts' },
  ];

  const secondaryItems = [
    { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?brand=therapick&tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin?brand=therapick&tab=settings' },
  ];

  const items = system === 'website' ? websitePrimaryItems : affiliatePrimaryItems;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 px-3 pb-1">
          {system === 'website' ? 'Website Management' : 'Affiliate Management'}
        </div>
        {items.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E293B] text-white shadow-xs font-bold border-l-2 border-[#facc15]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#facc15]' : 'text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-800 pt-3 space-y-1">
        <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 px-3 pb-1">
          Administration
        </div>
        {secondaryItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E293B] text-white shadow-xs font-bold border-l-2 border-[#facc15]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#facc15]' : 'text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

