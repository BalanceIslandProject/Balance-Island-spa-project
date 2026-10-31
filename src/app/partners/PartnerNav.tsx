'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Receipt, 
  Wallet, 
  Share2, 
  User, 
  TrendingUp, 
  FileText, 
  MessageCircle, 
  HelpCircle, 
  Settings, 
  Search, 
  Menu, 
  X, 
  RefreshCw, 
  LogOut, 
  ChevronsUpDown, 
  Check, 
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function PartnerNav({ session }: { session: PartnerSessionData | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = session?.partner_code || 'BALIHEAD112';
    const link = `https://www.booktherapick.com/?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Kravio Grouped Navigation Architecture
  const mainNavItems = [
    { href: '/partners/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/partners/bookings', label: 'Bookings', icon: CalendarDays },
    { href: '/partners/commissions', label: 'Commissions', icon: Receipt },
    { href: '/partners/payouts', label: 'Payouts', icon: Wallet },
  ];

  const supportNavItems = [
    { href: 'https://wa.me/6285174119423', label: 'WhatsApp Concierge', icon: MessageCircle, isExternal: true },
    { href: '/partners/terms', label: 'Partner Guidelines', icon: ShieldCheck },
    { href: '/partners/profile', label: 'Settings', icon: Settings },
  ];

  const partnerInitials = `${session?.first_name?.[0] || 'P'}${session?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <>
      {/* ========================================================
          1. KRAVIO-INSPIRED DESKTOP SIDEBAR
         ======================================================== */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-[#e5e7eb] sticky top-0 h-screen shrink-0 z-30 self-start transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64 lg:w-68'
        }`}
      >
        {/* Brand & Sidebar Toggle Header */}
        <div className="h-16 px-5 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <Link 
            href={session ? '/partners/dashboard' : '/partners'} 
            className="flex items-center gap-2.5 min-w-0"
          >
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-6 w-auto max-w-[130px] object-contain"
            />
            {!collapsed && (
              <span className="font-mono text-[10px] font-semibold text-[#6b7280] bg-[#f3f4f6] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                Partner
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-[6px] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Search Bar with ⌘ K Shortcut */}
        {!collapsed && session && (
          <div className="px-4 pt-4 pb-2 shrink-0">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-[#9ca3af] pointer-events-none" />
              <input
                type="text"
                placeholder="Search anything"
                readOnly
                onClick={() => router.push('/partners/bookings')}
                className="w-full pl-9 pr-12 py-2 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111827] transition-colors cursor-pointer"
              />
              <span className="absolute right-2.5 font-mono text-[10px] text-[#9ca3af] bg-white border border-[#e5e7eb] px-1.5 py-0.5 rounded-[4px] shadow-xs pointer-events-none">
                ⌘ K
              </span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-3 space-y-6 overflow-y-auto no-scrollbar">
          {session ? (
            <>
              {/* SECTION 1: MAIN NAVIGATION */}
              <div className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
                    Main Navigation
                  </div>
                )}
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-[#111827] text-white shadow-xs'
                          : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6]'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : 'text-[#6b7280]'} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* SECTION 3: SUPPORT */}
              <div className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
                    Support
                  </div>
                )}
                {supportNavItems.map((item, idx) => {
                  const Icon = item.icon;
                  if (item.isExternal) {
                    return (
                      <a
                        key={idx}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors ${
                          collapsed ? 'justify-center px-2' : ''
                        }`}
                      >
                        <Icon size={16} className="text-[#6b7280]" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </a>
                    );
                  }
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#111827] text-white shadow-xs'
                          : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6]'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : 'text-[#6b7280]'} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <Link
                href="/partners"
                className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium text-[#111827] hover:bg-[#f3f4f6]"
              >
                <LayoutDashboard size={16} />
                <span>Program Overview</span>
              </Link>
              <Link
                href="/partners/login"
                className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] font-medium text-[#111827] hover:bg-[#f3f4f6]"
              >
                <User size={16} />
                <span>Partner Log In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Partner User Profile Card (Matches Kravio bottom-left card) */}
        {session && (
          <div className="p-3 border-t border-[#e5e7eb] shrink-0 bg-[#f9fafb]">
            {!collapsed ? (
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-white border border-[#e5e7eb] shadow-xs">
                <Link href="/partners/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-semibold text-xs flex items-center justify-center">
                      {partnerInitials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#16a34a] ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-xs font-semibold text-[#111827] truncate">
                      {session.first_name} {session.last_name || ''}
                    </div>
                    <div className="text-[10px] text-[#6b7280] truncate font-mono">
                      {session.email || `Code: ${session.partner_code}`}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-1 text-[#9ca3af] hover:text-red-600 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center p-2 rounded-[8px] hover:bg-red-50 text-[#6b7280] hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ========================================================
          2. MOBILE TOP BAR & SLIDE DRAWER (md:hidden)
         ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e5e7eb]">
        <div className="px-4 flex items-center justify-between h-14">
          <Link href={session ? '/partners/dashboard' : '/partners'} className="flex items-center gap-2">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-6 w-auto max-w-[120px] object-contain"
            />
            <span className="font-mono text-[9px] font-semibold text-[#6b7280] bg-[#f3f4f6] px-1.5 py-0.5 rounded-[4px] uppercase">
              Partner
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                router.refresh();
                window.location.reload();
              }}
              className="p-1.5 text-[#6b7280] hover:text-[#111827] rounded-[6px] border border-[#e5e7eb]"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#111827] rounded-[6px] border border-[#e5e7eb]"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#e5e7eb] bg-white p-4 space-y-3 animate-in slide-in-from-top-1">
            {session ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#111827] text-white text-xs font-semibold flex items-center justify-center">
                      {partnerInitials}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#111827] block">{session.first_name}</span>
                      <span className="text-[10px] text-[#6b7280] font-mono">#{session.partner_code}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-xs text-red-600 font-mono uppercase px-2.5 py-1 rounded-[6px] border border-red-200 bg-red-50"
                  >
                    Logout
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 p-2 rounded-[6px] text-xs font-medium ${
                          isActive ? 'bg-[#111827] text-white' : 'bg-[#f9fafb] text-[#374151] border border-[#e5e7eb]'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#e5e7eb] space-y-1">
                  <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                    Support & Settings
                  </div>
                  {supportNavItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    if (item.isExternal) {
                      return (
                        <a
                          key={idx}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 p-2 rounded-[6px] text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6]"
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-[6px] text-xs font-medium ${
                          isActive ? 'bg-[#111827] text-white' : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Link href="/partners/login" className="block text-center py-2 text-xs font-semibold border rounded-[6px]">
                  Log In
                </Link>
                <Link href="/partners/register" className="block text-center py-2 text-xs font-semibold bg-[#111827] text-white rounded-[6px]">
                  Join Partner Program
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ========================================================
          3. MOBILE NATIVE BOTTOM NAVIGATION BAR
         ======================================================== */}
      {session && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e5e7eb] px-2 py-1 md:hidden pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-xs">
          <div className="grid grid-cols-5 items-center">
            {mainNavItems.concat([{ href: '/partners/profile', label: 'Settings', icon: Settings }]).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[6px] transition-colors ${
                    isActive ? 'text-[#111827] font-semibold' : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
