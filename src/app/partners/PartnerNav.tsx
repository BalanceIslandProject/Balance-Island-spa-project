'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  LayoutDashboard,
  CalendarDays, 
  Receipt, 
  Wallet, 
  Clock, 
  Settings, 
  LogOut, 
  Bell, 
  Check, 
  X,
  RotateCw,
  Search,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';

interface PartnerNavProps {
  session: PartnerSessionData | null;
}

export default function PartnerNav({ session }: PartnerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isRail, setIsRail] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Initialize theme and rail state from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cirrel:partner-theme');
      if (savedTheme) {
        const isDarkTheme = savedTheme === 'dark';
        setIsDark(isDarkTheme);
        const root = document.getElementById('partner-portal-root');
        if (root) {
          root.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
        }
      }

      const savedRail = localStorage.getItem('cirrel:partner-rail');
      if (savedRail === '1') {
        setIsRail(true);
        document.body.classList.add('cirrel-side-rail-active');
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const root = document.getElementById('partner-portal-root');
    if (root) {
      root.setAttribute('data-theme', nextDark ? 'dark' : 'light');
    }
    try {
      localStorage.setItem('cirrel:partner-theme', nextDark ? 'dark' : 'light');
    } catch (e) {}
  };

  const toggleRail = () => {
    const nextRail = !isRail;
    setIsRail(nextRail);
    if (nextRail) {
      document.body.classList.add('cirrel-side-rail-active');
    } else {
      document.body.classList.remove('cirrel-side-rail-active');
    }
    try {
      localStorage.setItem('cirrel:partner-rail', nextRail ? '1' : '0');
    } catch (e) {}
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    router.refresh();
    window.dispatchEvent(new Event('partner:refresh'));
    setTimeout(() => {
      setRefreshing(false);
    }, 750);
  };

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
    ? `${session.first_name[0] || 'P'}${session.last_name?.[0] || 'A'}`.toUpperCase()
    : 'PA';

  const partnerName = session?.first_name 
    ? `${session.first_name} ${session.last_name || ''}`.trim()
    : 'Partner Account';

  const partnerCode = session?.partner_code || 'PARTNER';

  // Navigation Links matching Cirrel & Partner Portal
  const portalItems = [
    { href: '/partners/overview', label: 'Overview', icon: LayoutDashboard, badge: 'Live' },
    { href: '/partners/bookings', label: 'Bookings', icon: CalendarDays },
    { href: '/partners/commissions', label: 'Commissions', icon: Receipt },
    { href: '/partners/payouts', label: 'Payouts', icon: Wallet },
  ];

  const toolItems = [
    { href: '/partners/history', label: 'History', icon: Clock },
    { href: '/partners/settings', label: 'Settings', icon: Settings },
  ];

  const isItemActive = (href: string) => {
    if (href === '/partners/overview') {
      return pathname === '/partners/overview' || pathname === '/partners/dashboard' || pathname === '/partners';
    }
    if (href === '/partners/settings') {
      return pathname === '/partners/settings' || pathname === '/partners/profile';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* ========================================================
          1. CIRREL FLOATING FROSTED GLASS SIDEBAR (DESKTOP)
         ======================================================== */}
      <aside className={`cirrel-side hidden md:flex ${isRail ? 'is-rail' : ''}`}>
        
        {/* Header / Brand with Glowing Blue Gradient Mark */}
        <div className="cirrel-side__head">
          <Link 
            href={session ? '/partners/overview' : '/partners'} 
            className="cirrel-brand"
            title="Therapick Partners Portal"
          >
            <div className="cirrel-mark">
              <Sparkles size={20} strokeWidth={2.2} />
            </div>
            <div className="cirrel-brand__text">
              <b>Therapick</b>
              <small>Partner Portal · Bali</small>
            </div>
          </Link>

          <button 
            type="button"
            onClick={toggleRail}
            className="cirrel-collapse"
            title={isRail ? "Expand sidebar" : "Collapse to rail"}
            aria-label="Toggle navigation rail"
          >
            {isRail ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Quick Search Trigger */}
        <div 
          className="cirrel-side__search"
          onClick={() => {
            const input = document.getElementById('cirrel-search-input');
            if (input) input.focus();
          }}
          title="Search portal"
        >
          <Search size={16} />
          <span>Search portal...</span>
          <span className="cirrel-kbd">⌘K</span>
        </div>

        {/* Navigation List */}
        <nav className="cirrel-snav">
          {session ? (
            <>
              <div className="cirrel-side__group">PORTAL</div>
              {portalItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`cirrel-snav__item ${active ? 'is-active' : ''}`}
                    title={item.label}
                  >
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                    <span className="cirrel-snav__label">{item.label}</span>
                    {item.badge && (
                      <span className="cirrel-snav__count">{item.badge}</span>
                    )}
                  </Link>
                );
              })}

              <div className="cirrel-side__group" style={{ marginTop: '12px' }}>TOOLS</div>
              {toolItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`cirrel-snav__item ${active ? 'is-active' : ''}`}
                    title={item.label}
                  >
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                    <span className="cirrel-snav__label">{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="space-y-1.5 pt-2">
              <Link
                href="/partners"
                className="cirrel-snav__item"
              >
                <span className="cirrel-snav__label">Program Overview</span>
              </Link>
              <Link
                href="/partners/login"
                className="cirrel-snav__item is-active"
              >
                <span className="cirrel-snav__label">Partner Log In</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer: Theme Switcher & Partner Profile Cell */}
        <div className="cirrel-side__foot">
          {/* Dark / Light Mode Switch */}
          <div className="cirrel-side__theme">
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
            <span>Dark mode</span>
            <button 
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className="cirrel-switch"
              title="Toggle dark/light mode"
            >
              <i></i>
            </button>
          </div>

          {/* User Account Card */}
          {session && (
            <div className="cirrel-side__me">
              <Link href="/partners/settings" className="flex items-center gap-2.5 min-w-0 flex-1 text-inherit">
                <div className="cirrel-av">
                  {partnerInitials}
                </div>
                <div className="cirrel-cell__text">
                  <b>{partnerName}</b>
                  <small>ref={partnerCode}</small>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 text-inherit opacity-60 hover:opacity-100 hover:text-[#ff6f66] transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE CIRREL TOP HEADER (md:hidden)
         ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-[var(--glass-hi)] backdrop-blur-xl border-b border-[var(--line)] px-4 h-14 flex items-center justify-between text-[var(--ink)]">
        <Link 
          href={session ? '/partners/overview' : '/partners'} 
          className="flex items-center gap-2.5 outline-none"
        >
          <div className="cirrel-mark" style={{ width: '30px', height: '30px', borderRadius: '10px' }}>
            <Sparkles size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <b className="text-sm font-bold leading-tight">Therapick</b>
            <span className="text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Partner Portal
            </span>
          </div>
        </Link>

        {session && (
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] rounded-[8px] transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh app data"
              aria-label="Refresh app data"
            >
              <RotateCw size={17} strokeWidth={1.8} className={refreshing ? 'animate-spin text-[var(--accent)]' : ''} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] rounded-[8px] relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.8} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-[var(--card)] backdrop-blur-xl rounded-xl border border-[var(--line)] shadow-2xl p-3.5 space-y-2 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <span className="font-semibold text-[var(--ink)]">Partner Notifications</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-[var(--card-2)] border border-[var(--line)]">
                    <div className="flex items-center gap-1.5 text-[var(--good)] font-medium text-[11px] mb-1">
                      <Check size={12} /> Live Attribution Active
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-snug">
                      Your referral link and QR code are tracking bookings in real time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link 
              href="/partners/settings" 
              className="cirrel-av"
              style={{ width: '30px', height: '30px', fontSize: '11px' }}
            >
              {partnerInitials}
            </Link>
          </div>
        )}
      </header>

      {/* ========================================================
          3. MOBILE CIRREL FROSTED GLASS BOTTOM TAB BAR (md:hidden)
         ======================================================== */}
      {session && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-[var(--glass-hi)] backdrop-blur-2xl border-t border-[var(--line)] px-2 py-1 md:hidden pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="grid grid-cols-6 items-center">
            {[...portalItems, ...toolItems].map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[10px] transition-all ${
                    active 
                      ? 'text-[var(--accent)] font-semibold' 
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 1.75} />
                  <span className="text-[9.5px] mt-0.5 tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
