'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  CalendarDays, 
  Receipt, 
  Wallet, 
  Clock, 
  Settings, 
  LogOut, 
  Bell, 
  Check, 
  X
} from 'lucide-react';

interface PartnerNavProps {
  session: PartnerSessionData | null;
}

export default function PartnerNav({ session }: PartnerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/affiliates/auth/logout', { method: 'POST' });
      router.push('/partners/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const partnerInitials = session?.first_name 
    ? `${session.first_name[0] || 'M'}${session.last_name?.[0] || 'A'}`.toUpperCase()
    : 'MA';

  const partnerName = session?.first_name 
    ? `${session.first_name} ${session.last_name || ''}`.trim()
    : 'Miko Arta';

  const partnerCode = session?.partner_code || 'MIKODRIV721';

  // 5 Canonical Sections matching the Partner Portal Reference Design
  const navItems = [
    { href: '/partners/bookings', label: 'Bookings', icon: CalendarDays },
    { href: '/partners/commissions', label: 'Commissions', icon: Receipt },
    { href: '/partners/payouts', label: 'Payouts', icon: Wallet },
    { href: '/partners/history', label: 'History', icon: Clock },
    { href: '/partners/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* ========================================================
          1. DESKTOP SIDEBAR (FIXED, REFINED MINIMAL SAAS)
         ======================================================== */}
      <aside className="hidden md:flex flex-col bg-white border-r border-[#e2e8f0] sticky top-0 h-screen max-h-screen shrink-0 z-30 self-start w-60 lg:w-64 select-none">
        
        {/* Brand & Partner Badge */}
        <div className="h-16 px-6 border-b border-[#f1f5f9] flex items-center justify-between shrink-0">
          <Link 
            href={session ? '/partners/bookings' : '/partners'} 
            className="flex items-center gap-2.5 min-w-0"
          >
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-6 w-auto max-w-[125px] object-contain"
            />
            <span className="text-[10px] font-semibold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe] px-2 py-0.5 rounded-[4px] tracking-wider uppercase">
              Partner
            </span>
          </Link>
        </div>

        {/* 5 Navigation Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          {session ? (
            navItems.map((item) => {
              const Icon = item.icon;
              // Match active state for bookings/dashboard or settings/profile
              const isActive = pathname === item.href || 
                (item.href === '/partners/bookings' && (pathname === '/partners' || pathname === '/partners/dashboard')) ||
                (item.href === '/partners/settings' && pathname === '/partners/profile');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#0f172a] text-white shadow-xs'
                      : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                  }`}
                >
                  <Icon 
                    size={17} 
                    strokeWidth={isActive ? 2 : 1.75} 
                    className={isActive ? 'text-white' : 'text-[#64748b]'} 
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })
          ) : (
            <div className="space-y-1 pt-2">
              <Link
                href="/partners"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-[13px] font-medium text-[#0f172a] hover:bg-[#f8fafc]"
              >
                <span>Program Overview</span>
              </Link>
              <Link
                href="/partners/login"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-[13px] font-medium bg-[#0f172a] text-white"
              >
                <span>Partner Log In</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom Profile Pill */}
        {session && (
          <div className="p-3.5 border-t border-[#f1f5f9] shrink-0 bg-white">
            <div className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#f8fafc] transition-colors">
              <Link href="/partners/settings" className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {partnerInitials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-semibold text-[#0f172a] truncate">
                    {partnerName}
                  </div>
                  <div className="text-[11px] text-[#64748b] truncate font-mono uppercase tracking-wide">
                    {partnerCode}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 text-[#94a3b8] hover:text-rose-600 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================
          2. MOBILE COMPACT TOP HEADER (md:hidden)
         ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-4 h-14 flex items-center justify-between">
        <Link 
          href={session ? '/partners/bookings' : '/partners'} 
          className="flex items-center gap-2"
        >
          <img
            src="/therapick-logo-2.png"
            alt="Therapick"
            className="h-5.5 w-auto max-w-[115px] object-contain"
          />
          <span className="text-[9px] font-semibold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
            Partner
          </span>
        </Link>

        {session && (
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-[6px] relative"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.8} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#16a34a] ring-2 ring-white" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#e2e8f0] shadow-xl p-3.5 space-y-2 z-50 text-xs animate-in fade-in-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                    <span className="font-semibold text-[#0f172a]">Partner Notifications</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[#94a3b8] hover:text-[#0f172a]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#f8fafc] border border-[#f1f5f9]">
                    <div className="flex items-center gap-1.5 text-[#16a34a] font-medium text-[11px] mb-1">
                      <Check size={12} /> Live Attribution
                    </div>
                    <p className="text-[11px] text-[#475569] leading-snug">
                      Your referral link and QR code are tracking bookings in real time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link 
              href="/partners/settings" 
              className="w-7.5 h-7.5 rounded-full bg-[#0f172a] text-white text-[11px] font-semibold flex items-center justify-center shrink-0"
            >
              {partnerInitials}
            </Link>
          </div>
        )}
      </header>

      {/* ========================================================
          3. MOBILE DEDICATED BOTTOM NAVIGATION (md:hidden)
         ======================================================== */}
      {session && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] px-1 py-1 md:hidden pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg">
          <div className="grid grid-cols-5 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href === '/partners/bookings' && (pathname === '/partners' || pathname === '/partners/dashboard')) ||
                (item.href === '/partners/settings' && pathname === '/partners/profile');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-h-[48px] py-1 rounded-[6px] transition-colors ${
                    isActive ? 'text-[#0f172a] font-semibold' : 'text-[#94a3b8] hover:text-[#64748b]'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
