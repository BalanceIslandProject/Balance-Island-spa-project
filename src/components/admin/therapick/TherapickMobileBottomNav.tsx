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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 flex items-center justify-around shadow-lg select-none">
      {navItems.map(item => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-neutral-950 font-bold' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${
              isActive ? 'bg-[#facc15] text-neutral-950 shadow-2xs' : ''
            }`}>
              <Icon size={18} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
