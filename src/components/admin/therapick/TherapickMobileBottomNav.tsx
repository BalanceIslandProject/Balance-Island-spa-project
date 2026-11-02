'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, Layers, TrendingUp } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickMobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { system, setActiveTab } = useTherapickAdmin();

  const currentTab = searchParams.get('tab') || (pathname === '/admin/bookings' ? 'bookings' : pathname === '/admin/partners' ? 'partners' : pathname === '/admin/commissions' ? 'commission' : pathname === '/admin/payouts' ? 'payouts' : 'overview');

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      href: '/admin?brand=therapick&tab=overview',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarDays,
      href: '/admin?brand=therapick&tab=bookings',
    },
    system === 'website' ? {
      id: 'services',
      label: 'Services',
      icon: Layers,
      href: '/admin?brand=therapick&tab=services',
    } : {
      id: 'partners',
      label: 'Partners',
      icon: Users,
      href: '/admin?brand=therapick&tab=partners',
    },
    {
      id: 'reports',
      label: 'Finance',
      icon: TrendingUp,
      href: '/admin?brand=therapick&tab=reports',
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--fitlo-card,#fdfdfb)]/95 backdrop-blur-md border-t border-[var(--fitlo-line,rgba(22,26,25,0.08))] px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg select-none">
      {navItems.map(item => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-[var(--fitlo-accent,#0b7a73)] font-bold' : 'text-[var(--fitlo-muted,#5f6665)] hover:text-[var(--fitlo-ink,#161a19)]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${
              isActive ? 'bg-[var(--fitlo-accent-soft,#d8ecee)] text-[var(--fitlo-accent,#0b7a73)]' : ''
            }`}>
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
