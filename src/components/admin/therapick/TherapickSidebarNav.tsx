'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, CalendarDays, Calendar, Users, Layers, 
  TrendingUp, Wallet, FileText, Settings, Receipt, Clock, Plus, Megaphone, Building2 
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
  const { system, setActiveTab, setIsAddBookingOpen } = useTherapickAdmin();

  const currentTab = searchParams.get('tab') || (pathname === '/admin/bookings' ? 'bookings' : pathname === '/admin/partners' ? 'partners' : pathname === '/admin/commissions' ? 'commission' : pathname === '/admin/payouts' ? 'payouts' : pathname === '/admin/settings' ? 'settings' : pathname === '/admin/campaigns' ? 'campaigns' : pathname === '/admin/partner-spas' ? 'partner-spas' : 'overview');

  // Website System Navigation (Fitlo 11-Item Nav)
  const websitePrimaryItems: NavItemDef[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings', badge: 'Live' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'therapists', label: 'Therapists & Fees', icon: Clock, href: '/admin?brand=therapick&tab=therapists' },
    { id: 'services', label: 'Menu Overview', icon: Layers, href: '/admin?brand=therapick&tab=services' },
    { id: 'campaigns', label: 'Campaign Cards', icon: Megaphone, href: '/admin?brand=therapick&tab=campaigns' },
    { id: 'partner-spas', label: 'Partner Spas', icon: Building2, href: '/admin?brand=therapick&tab=partner-spas' },
    { id: 'customers', label: 'Customers', icon: Users, href: '/admin?brand=therapick&tab=customers' },
    { id: 'revenue', label: 'Revenue & Profit', icon: TrendingUp, href: '/admin?brand=therapick&tab=revenue' },
    { id: 'payments', label: 'Payments', icon: Wallet, href: '/admin?brand=therapick&tab=payments' },
    { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?brand=therapick&tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin?brand=therapick&tab=settings' },
  ];

  // Affiliate System Navigation (Fitlo 8-Item Nav)
  const affiliatePrimaryItems: NavItemDef[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'partners', label: 'Partners', icon: Users, href: '/admin?brand=therapick&tab=partners', badge: 'Active' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'commission', label: 'Commission', icon: Receipt, href: '/admin?brand=therapick&tab=commission' },
    { id: 'payouts', label: 'Payouts', icon: Wallet, href: '/admin?brand=therapick&tab=payouts' },
    { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?brand=therapick&tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin?brand=therapick&tab=settings' },
  ];

  const primaryItems = system === 'website' ? websitePrimaryItems : affiliatePrimaryItems;

  const handleNavClick = (item: NavItemDef) => {
    setActiveTab(item.id);
  };

  return (
    <aside className="fitlo-side hidden lg:flex select-none">
      
      {/* Brand Logo */}
      <Link href="/admin?brand=therapick&tab=overview" className="fitlo-brand" title="Therapick Admin Dashboard">
        <img 
          src="/therapick-logo-2.png" 
          alt="Therapick" 
          className="h-8 w-auto max-w-[155px] object-contain"
        />
      </Link>

      {/* Navigation List */}
      <nav className="fitlo-snav">
        {primaryItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleNavClick(item)}
              className={`fitlo-snav__item ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="fitlo-snav__label">{item.label}</span>
              {item.badge && (
                <span className="fitlo-nav__count">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Action: Add Booking */}
      <div className="fitlo-side__group">
        <div className="fitlo-side__head">Quick action</div>
        <button
          type="button"
          onClick={() => setIsAddBookingOpen(true)}
          className="fitlo-side__quick"
          title="Create New Booking"
        >
          <span className="fitlo-side__plus">+</span>
          <span>Add a booking</span>
        </button>
      </div>

      {/* Fitlo Sidebar Footer */}
      <div className="pt-3 border-t border-[var(--fitlo-line)] flex items-center justify-between text-xs text-[var(--fitlo-muted)] font-medium">
        <span className="capitalize">{system} portal</span>
        <span className="w-2 h-2 rounded-full bg-[var(--fitlo-accent)] animate-pulse" />
      </div>
    </aside>
  );
}

// Exported for Mobile Slide-Out Drawer
export function TherapickMobileDrawerLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { system, setActiveTab } = useTherapickAdmin();

  const currentTab = searchParams.get('tab') || 'overview';

  const websitePrimaryItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'therapists', label: 'Therapists & Fees', icon: Clock, href: '/admin?brand=therapick&tab=therapists' },
    { id: 'services', label: 'Menu Overview', icon: Layers, href: '/admin?brand=therapick&tab=services' },
    { id: 'campaigns', label: 'Campaign Cards', icon: Megaphone, href: '/admin?brand=therapick&tab=campaigns' },
    { id: 'partner-spas', label: 'Partner Spas', icon: Building2, href: '/admin?brand=therapick&tab=partner-spas' },
    { id: 'customers', label: 'Customers', icon: Users, href: '/admin?brand=therapick&tab=customers' },
    { id: 'revenue', label: 'Revenue & Profit', icon: TrendingUp, href: '/admin?brand=therapick&tab=revenue' },
    { id: 'payments', label: 'Payments', icon: Wallet, href: '/admin?brand=therapick&tab=payments' },
    { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?brand=therapick&tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin?brand=therapick&tab=settings' },
  ];

  const affiliatePrimaryItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin?brand=therapick&tab=overview' },
    { id: 'partners', label: 'Partners', icon: Users, href: '/admin?brand=therapick&tab=partners' },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, href: '/admin?brand=therapick&tab=bookings' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/admin?brand=therapick&tab=calendar' },
    { id: 'commission', label: 'Commission', icon: Receipt, href: '/admin?brand=therapick&tab=commission' },
    { id: 'payouts', label: 'Payouts', icon: Wallet, href: '/admin?brand=therapick&tab=payouts' },
    { id: 'reports', label: 'Reports', icon: FileText, href: '/admin?brand=therapick&tab=reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin?brand=therapick&tab=settings' },
  ];

  const primaryItems = system === 'website' ? websitePrimaryItems : affiliatePrimaryItems;

  return (
    <div className="space-y-1">
      {primaryItems.map((item) => {
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
            className={`fitlo-snav__item ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="fitlo-snav__label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
