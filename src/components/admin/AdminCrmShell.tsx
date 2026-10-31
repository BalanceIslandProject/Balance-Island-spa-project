'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  CalendarDays, 
  Users, 
  Layers, 
  User, 
  Ticket, 
  Wallet, 
  Settings, 
  Bell, 
  ExternalLink, 
  ChevronDown, 
  Menu, 
  X, 
  Check, 
  Clock,
  ShieldCheck,
  Megaphone,
  UserCheck,
  Receipt
} from 'lucide-react';

interface AdminCrmShellProps {
  children: React.ReactNode;
}

export type NavScope = 'all' | 'website' | 'affiliate';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
}

interface NavSection {
  id: 'website' | 'affiliate' | 'system';
  title: string;
  badge?: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORGANIZED, NON-DUPLICATED NAVIGATION SECTIONS
// Separates items belonging to the Main Website vs Affiliate System cleanly.
// ─────────────────────────────────────────────────────────────────────────────
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'website',
    title: 'MAIN WEBSITE',
    badge: 'Website',
    items: [
      { label: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
      { label: 'Treatments', href: '/admin?tab=treatment', icon: Layers },
      { label: 'Customers', href: '/admin?tab=list', icon: User },
      { label: 'Promo Codes', href: '/admin?tab=promo', icon: Ticket },
      { label: 'Therapists & Fees', href: '/admin?tab=fees', icon: Clock },
    ],
  },
  {
    id: 'affiliate',
    title: 'AFFILIATE SYSTEM',
    badge: 'Affiliates',
    items: [
      { label: 'Affiliates', href: '/admin/affiliates', icon: Users },
      { label: 'Applications', href: '/admin/applications', icon: UserCheck },
      { label: 'Commission Management', href: '/admin/commissions', icon: Receipt },
      { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
      { label: 'Campaign Cards', href: '/admin?tab=campaign', icon: Megaphone },
    ],
  },
  {
    id: 'system',
    title: 'SYSTEM',
    badge: 'Config',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
    ],
  },
];

// Available Admin Consoles for the Dropdown Switcher
const ADMIN_CONSOLES = [
  {
    id: 'all',
    name: 'All Consoles (Unified)',
    shortName: 'Admin Console',
    scope: 'all' as NavScope,
    href: '/admin/bookings',
    badge: 'Unified',
    description: 'Unified management of both website operations and affiliate network',
  },
  {
    id: 'website',
    name: 'Main Website Console',
    shortName: 'Website Console',
    scope: 'website' as NavScope,
    href: '/admin/bookings',
    badge: 'Main Site',
    description: 'Spa bookings, treatments, customer profiles & website promo codes',
  },
  {
    id: 'affiliate',
    name: 'Affiliate System Console',
    shortName: 'Affiliate Console',
    scope: 'affiliate' as NavScope,
    href: '/admin/affiliates',
    badge: 'Affiliates',
    description: 'Partner directory, referral codes, commissions & payouts',
  },
  {
    id: 'partners',
    name: 'Partner Portal (Live)',
    shortName: 'Partner Portal',
    scope: null,
    href: '/partners/dashboard',
    badge: 'Portal',
    description: 'External partner-facing dashboard & referral tracking',
  },
  {
    id: 'storefront',
    name: 'Customer Live Store',
    shortName: 'Storefront',
    scope: null,
    href: '/',
    badge: 'Live Site',
    description: 'Live customer-facing booking engine & rituals store',
  },
];

export default function AdminCrmShell({ children }: AdminCrmShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Console Switcher State
  const [consoleDropdownOpen, setConsoleDropdownOpen] = useState(false);
  const consoleDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Detect which system the current URL belongs to
  const isAffiliateRoute = pathname.startsWith('/admin/affiliates') || 
                          pathname.startsWith('/admin/partners') || 
                          pathname.startsWith('/admin/applications') || 
                          pathname.startsWith('/admin/commissions') || 
                          pathname.startsWith('/admin/payouts');

  // Track active scope: 'all' | 'website' | 'affiliate'
  const [userScope, setUserScope] = useState<NavScope | null>(null);

  // Auto-align default scope with route unless user explicitly selected one
  const activeScope: NavScope = userScope || (isAffiliateRoute ? 'affiliate' : 'website');

  // Filter visible sections based on active scope (No Duplication!)
  const visibleSections = useMemo(() => {
    if (activeScope === 'website') {
      return NAV_SECTIONS.filter((s) => s.id === 'website' || s.id === 'system');
    }
    if (activeScope === 'affiliate') {
      return NAV_SECTIONS.filter((s) => s.id === 'affiliate' || s.id === 'system');
    }
    return NAV_SECTIONS;
  }, [activeScope]);

  // Close console dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (consoleDropdownRef.current && !consoleDropdownRef.current.contains(event.target as Node)) {
        setConsoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep /admin/login standalone without the CRM shell
  if (pathname.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  const isItemActive = (href: string) => {
    if (href === '/admin/bookings') {
      return pathname === '/admin/bookings' || (pathname === '/admin' && !href.includes('tab='));
    }
    if (href === '/admin/partners' || href === '/admin/affiliates') {
      return pathname === '/admin/partners' || pathname === '/admin/affiliates';
    }
    if (href.includes('?tab=')) {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const currentTab = urlParams.get('tab');
        const itemTab = href.split('?tab=')[1];
        return pathname === '/admin' && currentTab === itemTab;
      }
      return false;
    }
    return pathname.startsWith(href);
  };

  const consoleLabel = activeScope === 'affiliate' 
    ? 'Affiliate Console' 
    : activeScope === 'website' 
    ? 'Website Console' 
    : 'Admin Console';

  return (
    <div className="min-h-screen w-full bg-[#fbfaf7] text-neutral-900 font-sans antialiased flex flex-col selection:bg-amber-300 selection:text-neutral-950">
      
      {/* ═══════════════════════════════════════════════════════════════
          1. COMPACT TOP NAVIGATION BAR & ADMIN CONSOLE SWITCHER
         ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#eaecf0] px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Left: Mobile Hamburger + THERAPICK Brand + Console Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Mobile Drawer Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-stone-700 hover:text-neutral-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* THERAPICK Logo */}
          <Link href="/admin/bookings" className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15] shrink-0 shadow-2xs" />
            <span className="font-extrabold tracking-wider text-sm sm:text-base text-neutral-900 uppercase font-sans">
              THERAPICK
            </span>
          </Link>

          {/* Admin Console Switcher Dropdown */}
          <div className="relative" ref={consoleDropdownRef}>
            <button
              type="button"
              onClick={() => setConsoleDropdownOpen(!consoleDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 hover:bg-stone-200/90 border border-stone-200 text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-2xs active:scale-95"
              aria-expanded={consoleDropdownOpen}
              aria-haspopup="true"
            >
              <span>{consoleLabel}</span>
              <ChevronDown 
                size={13} 
                className={`text-stone-500 transition-transform duration-200 ${consoleDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {consoleDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white border border-[#eaecf0] rounded-2xl p-2 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100">
                  Switch Admin Console
                </div>
                <div className="py-1 space-y-1">
                  {ADMIN_CONSOLES.map((c) => {
                    const isSelected = 
                      (c.scope && c.scope === activeScope) ||
                      (!c.scope && pathname === c.href);

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setConsoleDropdownOpen(false);
                          if (c.scope) {
                            setUserScope(c.scope);
                          }
                          if (c.href) {
                            router.push(c.href);
                          }
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected 
                            ? 'bg-stone-100 text-neutral-900 font-semibold' 
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate">{c.name}</span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-700">
                              {c.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {c.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Site, Notifications, Administrator Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
            title="Open Live Website"
          >
            <span>Live Site</span>
            <ExternalLink size={12} className="text-stone-400" />
          </Link>

          {/* Notifications Button */}
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-700 relative shadow-2xs transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={14} />
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white absolute top-1.5 right-1.5" />
          </button>

          {/* Admin Profile Circle */}
          <div 
            className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-default select-none"
            title="Therapick Administrator"
          >
            TP
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. MAIN BODY (SIDEBAR + CONTENT CANVAS)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto min-h-0">
        
        {/* ─── DESKTOP SIDEBAR NAVIGATION (Grouped & Non-Duplicated) ─── */}
        <aside className="hidden lg:flex flex-col w-60 lg:w-64 shrink-0 py-5 px-3 select-none sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
          
          {/* Scope Filter Segmented Switcher */}
          <div className="px-1 pb-3">
            <div className="bg-stone-100/90 p-1 rounded-xl flex items-center gap-1 border border-stone-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setUserScope('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  activeScope === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-neutral-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserScope('website');
                  if (isAffiliateRoute) router.push('/admin/bookings');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  activeScope === 'website'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-neutral-900'
                }`}
              >
                Website
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserScope('affiliate');
                  if (!isAffiliateRoute) router.push('/admin/affiliates');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                  activeScope === 'affiliate'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-stone-500 hover:text-neutral-900'
                }`}
              >
                Affiliates
              </button>
            </div>
          </div>

          {/* Navigation Sections (Grouped without any duplication!) */}
          <div className="space-y-4 pb-6">
            {visibleSections.map((section) => (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                    {section.title}
                  </span>
                  {section.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">
                      {section.badge}
                    </span>
                  )}
                </div>

                {/* Section Items */}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isItemActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#111827] text-white shadow-xs'
                            : 'text-stone-700 hover:text-neutral-950 hover:bg-stone-100/80'
                        }`}
                      >
                        <Icon size={16} className={active ? 'text-white' : 'text-stone-500'} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── MOBILE SLIDE-OUT NAVIGATION DRAWER ─── */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col p-4 z-50 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#facc15] shrink-0" />
                  <span className="font-extrabold tracking-wider text-sm text-neutral-900 uppercase">
                    THERAPICK
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 text-stone-500 hover:text-neutral-900 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scope Switcher on Mobile */}
              <div className="py-3">
                <div className="bg-stone-100/90 p-1 rounded-xl flex items-center gap-1 border border-stone-200/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setUserScope('all')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      activeScope === 'all'
                        ? 'bg-white text-neutral-900 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-neutral-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserScope('website');
                      if (isAffiliateRoute) {
                        setMobileDrawerOpen(false);
                        router.push('/admin/bookings');
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      activeScope === 'website'
                        ? 'bg-white text-neutral-900 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-neutral-900'
                    }`}
                  >
                    Website
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserScope('affiliate');
                      if (!isAffiliateRoute) {
                        setMobileDrawerOpen(false);
                        router.push('/admin/affiliates');
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      activeScope === 'affiliate'
                        ? 'bg-white text-neutral-900 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-neutral-900'
                    }`}
                  >
                    Affiliates
                  </button>
                </div>
              </div>

              {/* Grouped Mobile Navigation */}
              <div className="space-y-4 py-2">
                {visibleSections.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="flex items-center justify-between px-2 pt-2 pb-1">
                      <span className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase">
                        {section.title}
                      </span>
                      {section.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isItemActive(item.href);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileDrawerOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              active
                                ? 'bg-[#111827] text-white shadow-xs'
                                : 'text-stone-700 hover:text-neutral-950 hover:bg-stone-100/80'
                            }`}
                          >
                            <Icon size={16} className={active ? 'text-white' : 'text-stone-500'} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Drawer Footer with Live Site */}
              <div className="mt-auto pt-4 border-t border-stone-100">
                <Link
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <span>Open Live Website</span>
                  <ExternalLink size={12} className="text-stone-400" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT VIEWPORT ─── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
