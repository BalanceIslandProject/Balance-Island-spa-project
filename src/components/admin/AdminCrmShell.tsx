'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  Menu, 
  X, 
  Check, 
  Store,
  Clock,
  PlusCircle,
  Calculator,
  FileText,
  ShieldCheck,
  Megaphone,
  UserCheck,
  Receipt
} from 'lucide-react';

interface AdminCrmShellProps {
  children: React.ReactNode;
}

// Available Admin Consoles for the Switcher
const ADMIN_CONSOLES = [
  {
    id: 'therapick',
    name: 'Therapick Admin Console',
    href: '/admin/bookings',
    badge: 'Active',
    description: 'Mobile spa treatments, bookings & partner attribution'
  },
  {
    id: 'central',
    name: 'Elexoir Central Console',
    href: '/admin?brand=central',
    badge: 'Central',
    description: 'Central operations, therapist fees & multi-brand spa'
  },
  {
    id: 'partners',
    name: 'Partner Portal',
    href: '/partners/dashboard',
    badge: 'Affiliates',
    description: 'Partner affiliate management, commissions & payouts'
  },
  {
    id: 'live',
    name: 'Customer Live Store',
    href: '/',
    badge: 'Storefront',
    description: 'Live customer-facing booking and rituals store'
  }
];

// Categorized Sidebar Navigation Structure
interface NavCategory {
  title: string;
  items: {
    label: string;
    href: string;
    icon: any;
    exact?: boolean;
  }[];
}

const SIDEBAR_CATEGORIES: NavCategory[] = [
  {
    title: 'BOOKINGS',
    items: [
      { label: 'Bookings', href: '/admin/bookings', icon: CalendarDays }
    ]
  },
  {
    title: 'PARTNERS',
    items: [
      { label: 'Affiliates', href: '/admin/partners', icon: Users },
      { label: 'Applications', href: '/admin/applications', icon: UserCheck },
      { label: 'Commission Management', href: '/admin/commissions', icon: Receipt },
      { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
      { label: 'Promo Codes', href: '/admin?tab=promo', icon: Ticket },
      { label: 'Campaign Cards', href: '/admin?tab=campaign', icon: Megaphone }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Treatments', href: '/admin?tab=treatment', icon: Layers },
      { label: 'Therapists & Fees', href: '/admin?tab=fees', icon: Clock },
      { label: 'Add-on Settings', href: '/admin?tab=addons', icon: PlusCircle },
      { label: 'Store Products', href: '/admin?tab=store', icon: Store }
    ]
  },
  {
    title: 'CUSTOMERS',
    items: [
      { label: 'Customers', href: '/admin?tab=list', icon: User }
    ]
  },
  {
    title: 'REPORTS & TOOLS',
    items: [
      { label: 'Commission Calculator', href: '/admin?tab=calculator', icon: Calculator },
      { label: 'Menu Overview', href: '/admin?tab=invoice', icon: FileText },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings }
    ]
  }
];

// Primary quick navigation items matching reference image
const PRIMARY_NAV_ITEMS = [
  { label: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
  { label: 'Affiliates', href: '/admin/partners', icon: Users },
  { label: 'Treatments', href: '/admin?tab=treatment', icon: Layers },
  { label: 'Customers', href: '/admin?tab=list', icon: User },
  { label: 'Promo Codes', href: '/admin?tab=promo', icon: Ticket },
  { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminCrmShell({ children }: AdminCrmShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Console Switcher State
  const [consoleDropdownOpen, setConsoleDropdownOpen] = useState(false);
  const consoleDropdownRef = useRef<HTMLDivElement>(null);

  // Mobile Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Category Collapsible State
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'REPORTS & TOOLS': true,
    'OPERATIONS': false,
    'PARTNERS': false,
    'BOOKINGS': false,
  });

  const toggleCategory = (catTitle: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catTitle]: !prev[catTitle]
    }));
  };

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

  // Determine active console
  const activeConsole = ADMIN_CONSOLES[0];

  // Keep /admin/login standalone without the CRM shell
  if (pathname.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  const isItemActive = (href: string) => {
    if (href === '/admin/bookings') {
      return pathname === '/admin/bookings' || (pathname === '/admin' && !href.includes('tab='));
    }
    if (href === '/admin/partners') {
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
              <span>Admin Console</span>
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
                    const isSelected = c.id === 'therapick';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setConsoleDropdownOpen(false);
                          router.push(c.href);
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
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-stone-200/80 text-stone-700">
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
        
        {/* ─── DESKTOP SIDEBAR NAVIGATION (Organized into Categories) ─── */}
        <aside className="hidden lg:flex flex-col w-60 lg:w-64 shrink-0 py-5 px-3 select-none sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
          
          {/* Section A: Primary Top Items (Exact match with reference image) */}
          <div className="space-y-1 pb-3">
            {PRIMARY_NAV_ITEMS.map((item) => {
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
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-stone-200/80 my-2" />

          {/* Section B: All Management Categories (Collapsible Folders) */}
          <div className="space-y-3 pb-6">
            <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
              Categories
            </div>

            {SIDEBAR_CATEGORIES.map((cat) => {
              const isCollapsed = collapsedCategories[cat.title];

              return (
                <div key={cat.title} className="space-y-0.5">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.title)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:text-neutral-900 uppercase tracking-wider font-mono cursor-pointer rounded-lg hover:bg-stone-100/60 transition-colors"
                  >
                    <span>{cat.title}</span>
                    <ChevronDown 
                      size={12} 
                      className={`text-stone-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
                    />
                  </button>

                  {/* Category Children Items */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-2">
                      {cat.items.map((subItem) => {
                        const active = isItemActive(subItem.href);
                        const SubIcon = subItem.icon;

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              active
                                ? 'bg-[#111827] text-white font-semibold shadow-xs'
                                : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-100/70'
                            }`}
                          >
                            <SubIcon size={14} className={active ? 'text-white' : 'text-stone-400'} />
                            <span className="truncate">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
                  className="p-1 text-stone-500 hover:text-neutral-900 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Primary Mobile Items */}
              <div className="space-y-1 py-3">
                {PRIMARY_NAV_ITEMS.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#111827] text-white shadow-xs'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-white' : 'text-stone-500'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-stone-200/80 my-2" />

              {/* Categorized List */}
              <div className="space-y-3 pb-6">
                {SIDEBAR_CATEGORIES.map((cat) => (
                  <div key={cat.title} className="space-y-1">
                    <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                      {cat.title}
                    </div>
                    <div className="space-y-0.5">
                      {cat.items.map((subItem) => {
                        const active = isItemActive(subItem.href);
                        const SubIcon = subItem.icon;

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setMobileDrawerOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                              active
                                ? 'bg-[#111827] text-white font-semibold'
                                : 'text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <SubIcon size={14} className={active ? 'text-white' : 'text-stone-400'} />
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT SURFACE ─── */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 space-y-4">
          {children}
        </main>

      </div>

    </div>
  );
}
