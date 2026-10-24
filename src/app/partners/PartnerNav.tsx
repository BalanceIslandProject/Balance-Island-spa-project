'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Receipt, 
  User, 
  LogOut,
  ExternalLink,
  Wallet,
  Check,
  Copy,
  MessageCircle,
  Share2
} from 'lucide-react';

export default function PartnerNav({ session }: { session: PartnerSessionData | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleOpenCalendar = () => {
    router.push('/partners/calendar');
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.partner_code) return;
    navigator.clipboard.writeText(session.partner_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.partner_code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.booktherapick.com';
    const link = `${origin}/?ref=${session.partner_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const authNavItems = [
    { href: '/partners/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/partners/referrals', label: 'Referrals', icon: Users },
    { href: '/partners/commissions', label: 'Commissions', icon: Receipt },
    { href: '/partners/payouts', label: 'Payouts', icon: Wallet },
    { href: '/partners/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* ========================================================
          1. DESKTOP PERMANENT SIDEBAR (hidden on mobile, md:flex)
          Liquid Apple Glass design language
         ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/75 backdrop-blur-2xl border-r border-neutral-200/60 sticky top-0 h-screen shrink-0 z-30 self-start shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Brand & Partner Identification */}
        <div className="p-5 border-b border-neutral-200/60 flex items-center justify-between shrink-0">
          <Link 
            href={session ? '/partners/dashboard' : '/partners'} 
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          >
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-900 bg-neutral-100/90 border border-neutral-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
              Partner
            </span>
          </Link>
        </div>

        {/* Navigation Links Area */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {session ? (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Workspace
              </div>
              
              {authNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                      isActive
                        ? 'bg-neutral-950 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-900/[0.04]'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? 'text-white' : 'text-neutral-500'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Interactive Calendar View Link in Sidebar */}
              <Link
                href="/partners/calendar"
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  pathname === '/partners/calendar'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-900/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} strokeWidth={pathname === '/partners/calendar' ? 2.3 : 1.8} className={pathname === '/partners/calendar' ? 'text-white' : 'text-neutral-500'} />
                  <span>Calendar View</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${pathname === '/partners/calendar' ? 'bg-emerald-400 ring-2 ring-neutral-800' : 'bg-emerald-500 ring-2 ring-emerald-100'}`} />
              </Link>

              {/* Quick Link Card in Sidebar */}
              {session.partner_code && (
                <div className="mt-4 pt-4 border-t border-neutral-100/90 px-1">
                  <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-neutral-200/70 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                        <Share2 size={11} />
                        Referral Link
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                        30d Cookie
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full text-left py-2 px-2.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80 text-neutral-900 text-[11px] font-mono truncate flex items-center justify-between gap-1 hover:border-neutral-900 transition-colors shadow-2xs cursor-pointer"
                      title="Click to copy full referral link"
                    >
                      <span className="truncate">?ref={session.partner_code}</span>
                      {copiedLink ? <Check size={12} className="text-emerald-600 shrink-0" /> : <Copy size={12} className="text-neutral-400 shrink-0" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Menu
              </div>
              <Link
                href="/partners"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === '/partners'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Program Overview</span>
              </Link>
              <Link
                href="/partners/login"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === '/partners/login'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                <User size={16} />
                <span>Partner Log In</span>
              </Link>
              <Link
                href="/partners/register"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === '/partners/register'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                <Users size={16} />
                <span>Become a Partner</span>
              </Link>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-200/60 space-y-1.5 shrink-0">
          <a
            href="https://www.booktherapick.com"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70 transition-colors"
          >
            <span>Visit Live Site</span>
            <ExternalLink size={13} />
          </a>
          <a
            href="https://wa.me/6285174119423"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70 transition-colors"
          >
            <span>WhatsApp Support</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">Help</span>
          </a>

          {session && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50/80 transition-colors text-left pt-2 border-t border-neutral-100 cursor-pointer"
            >
              <LogOut size={14} />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE STICKY HEADER (hidden on desktop, md:hidden; hidden on calendar section on mobile)
         ======================================================== */}
      <header className={`md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 transition-all ${
        pathname === '/partners/calendar' ? 'hidden' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            
            {/* Mobile Brand Logo */}
            <Link 
              href={session ? '/partners/dashboard' : '/partners'} 
              className="flex items-center gap-2"
            >
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-6 w-auto max-w-[130px] object-contain"
              />
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
                Partner
              </span>
            </Link>

            {/* Mobile Header Right (Hamburger Menu Only) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Top Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200/80 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-1 duration-150">
            {session ? (
              <>
                <div className="pb-3 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-neutral-950 text-white text-xs font-bold flex items-center justify-center uppercase">
                      {session.first_name?.[0] || 'P'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-950 block">
                        {session.first_name}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Partner #{session.partner_code}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-xs text-neutral-700 font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    {loggingOut ? 'Signing out...' : 'Log out'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {authNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-neutral-950 text-white' 
                            : 'text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenCalendar();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-800 border border-neutral-200/80 hover:bg-neutral-100 text-left"
                  >
                    <CalendarDays size={14} className="text-neutral-700" />
                    <span>Calendar</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <a
                    href="https://www.booktherapick.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-neutral-900 font-medium"
                  >
                    <span>Visit BookTherapick</span>
                    <ExternalLink size={11} />
                  </a>
                  <a
                    href="https://wa.me/6285174119423"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-900 font-medium"
                  >
                    WhatsApp Support
                  </a>
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <Link
                  href="/partners"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-neutral-800 py-2"
                >
                  Program Overview
                </Link>
                <Link
                  href="/partners/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-center text-neutral-900 border border-neutral-300 py-2.5 rounded-lg hover:bg-neutral-50"
                >
                  Partner Log In
                </Link>
                <Link
                  href="/partners/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-center text-white bg-neutral-950 py-2.5 rounded-lg hover:bg-neutral-800 shadow-xs"
                >
                  Join Therapick Partner Network
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ========================================================
          3. MOBILE APP NATIVE BOTTOM NAVIGATION BAR (md:hidden)
         ======================================================== */}
      {session && (
        <nav 
          aria-label="Mobile bottom navigation"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-neutral-200/60 px-2 py-1 md:hidden pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
        >
          <div className="grid grid-cols-5 items-center">
            {/* 1. Dashboard */}
            <Link
              href="/partners/dashboard"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                pathname === '/partners/dashboard'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 font-medium'
              }`}
            >
              <LayoutDashboard size={18} strokeWidth={pathname === '/partners/dashboard' ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 tracking-tight">Overview</span>
            </Link>

            {/* 2. Payouts */}
            <Link
              href="/partners/payouts"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                pathname === '/partners/payouts'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 font-medium'
              }`}
            >
              <Wallet size={18} strokeWidth={pathname === '/partners/payouts' ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 tracking-tight">Payouts</span>
            </Link>

            {/* 3. Calendar (Center Highlight Tab) */}
            {/* 3. Calendar (Center Highlight Tab) */}
            <Link
              href="/partners/calendar"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 transition-all ${
                pathname === '/partners/calendar' ? 'text-neutral-950 font-bold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className={`relative p-1 rounded-lg border transition-colors ${
                pathname === '/partners/calendar' ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-neutral-100 border-neutral-200 text-neutral-900'
              }`}>
                <CalendarDays size={16} strokeWidth={2.2} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">Calendar</span>
            </Link>

            {/* 4. Ledger (Commissions) */}
            <Link
              href="/partners/commissions"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                pathname === '/partners/commissions'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 font-medium'
              }`}
            >
              <Receipt size={18} strokeWidth={pathname === '/partners/commissions' ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 tracking-tight">Ledger</span>
            </Link>

            {/* 5. Profile */}
            <Link
              href="/partners/profile"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                pathname === '/partners/profile'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 font-medium'
              }`}
            >
              <User size={18} strokeWidth={pathname === '/partners/profile' ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 tracking-tight">Profile</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
