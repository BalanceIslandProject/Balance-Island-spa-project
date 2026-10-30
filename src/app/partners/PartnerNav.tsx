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
  Share2,
  RefreshCw
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
    { href: '/partners/bookings', label: 'Bookings', icon: CalendarDays },
    { href: '/partners/commissions', label: 'Commissions', icon: Receipt },
    { href: '/partners/payouts', label: 'Payouts', icon: Wallet },
    { href: '/partners/referrals', label: 'Referrals & QR', icon: Share2 },
    { href: '/partners/profile', label: 'Settings', icon: User },
  ];

  return (
    <>
      {/* ========================================================
          1. DESKTOP PERMANENT SIDEBAR (hidden on mobile, md:flex)
          Vercel Light Minimalist Design Language
         ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#ebebeb] sticky top-0 h-screen shrink-0 z-30 self-start shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
        
        {/* Brand & Partner Identification */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between shrink-0">
          <Link 
            href={session ? '/partners/dashboard' : '/partners'} 
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          >
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
            <span className="inline-flex items-center h-5 px-2 rounded-[6px] border border-[#ebebeb] bg-[#fafafa] text-[10px] font-mono uppercase tracking-[0.071em] text-[#666666]">
              Partner
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              router.refresh();
              window.location.reload();
            }}
            className="p-1.5 text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
            title="Refresh partner portal"
            aria-label="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Navigation Links Area */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {session ? (
            <>
              <div className="px-3 pt-2 pb-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.071em] text-[#666666]">
                Workspace
              </div>
              
              {authNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-[6px] text-[13px] font-normal transition-colors ${
                      isActive
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]'
                    }`}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2 : 1.75} className={isActive ? 'text-white' : 'text-[#666666]'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Quick Link Card in Sidebar */}
              {session.partner_code && (
                <div className="mt-4 pt-4 border-t border-[#ebebeb] px-1">
                  <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] flex items-center gap-1.5">
                        <Share2 size={11} />
                        Referral Link
                      </span>
                      <span className="text-[10px] text-[#666666] border border-[#ebebeb] bg-white px-1.5 py-0.5 rounded-[4px] font-mono">
                        Per Booking
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full text-left py-2 px-2.5 rounded-[6px] bg-white border border-[#ebebeb] text-[#171717] text-[12px] font-mono truncate flex items-center justify-between gap-1 hover:border-[#171717] transition-colors cursor-pointer"
                      title="Click to copy full referral link"
                    >
                      <span className="truncate">?ref={session.partner_code}</span>
                      {copiedLink ? <Check size={13} className="text-[#297a3a] shrink-0" /> : <Copy size={13} className="text-[#8f8f8f] shrink-0" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1.5 font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666]">
                Menu
              </div>
              <Link
                href="/partners"
                className={`flex items-center gap-3 px-3.5 py-2 rounded-[6px] text-[13px] font-normal transition-colors ${
                  pathname === '/partners'
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                <LayoutDashboard size={15} />
                <span>Program Overview</span>
              </Link>
              <Link
                href="/partners/login"
                className={`flex items-center gap-3 px-3.5 py-2 rounded-[6px] text-[13px] font-normal transition-colors ${
                  pathname === '/partners/login'
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                <User size={15} />
                <span>Partner Log In</span>
              </Link>
              <Link
                href="/partners/register"
                className={`flex items-center gap-3 px-3.5 py-2 rounded-[6px] text-[13px] font-normal transition-colors ${
                  pathname === '/partners/register'
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                <Users size={15} />
                <span>Become a Partner</span>
              </Link>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#ebebeb] space-y-1.5 shrink-0">
          <a
            href="https://www.booktherapick.com"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[13px] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
          >
            <span>Visit Live Site</span>
            <ExternalLink size={13} />
          </a>
          <a
            href="https://wa.me/6285174119423"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[13px] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] transition-colors"
          >
            <span>WhatsApp Support</span>
            <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb]">Help</span>
          </a>

          {session && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left pt-2 border-t border-[#ebebeb] cursor-pointer"
            >
              <LogOut size={14} />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE STICKY HEADER (hidden on desktop, md:hidden)
         ======================================================== */}
      <header className={`md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#ebebeb] transition-all ${
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
              <span className="inline-flex items-center h-5 px-1.5 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[10px] font-mono uppercase tracking-[0.071em] text-[#666666]">
                Partner
              </span>
            </Link>

            {/* Mobile Header Right (Refresh & Hamburger Menu) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  router.refresh();
                  window.location.reload();
                }}
                className="p-1.5 text-[#666666] hover:text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
                aria-label="Refresh page"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Top Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#ebebeb] bg-white px-4 py-4 space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-in slide-in-from-top-1 duration-150">
            {session ? (
              <>
                <div className="pb-3 border-b border-[#ebebeb] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[6px] bg-[#171717] text-white text-xs font-mono flex items-center justify-center uppercase">
                      {session.first_name?.[0] || 'P'}
                    </div>
                    <div>
                      <span className="text-[13px] font-medium text-[#171717] block">
                        {session.first_name}
                      </span>
                      <span className="text-[11px] text-[#666666] font-mono">
                        Partner #{session.partner_code}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-xs text-[#171717] font-mono uppercase tracking-[0.071em] px-3 py-1.5 rounded-[6px] border border-[#ebebeb] hover:bg-[#fafafa] transition-colors"
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
                        className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-normal transition-colors ${
                          isActive 
                            ? 'bg-[#171717] text-white' 
                            : 'text-[#171717] hover:bg-[#fafafa] border border-[#ebebeb]'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between text-xs text-[#666666]">
                  <a
                    href="https://www.booktherapick.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-[#171717] font-normal"
                  >
                    <span>Visit BookTherapick</span>
                    <ExternalLink size={11} />
                  </a>
                  <a
                    href="https://wa.me/6285174119423"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#171717] font-normal"
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
                  className="block text-xs font-normal text-[#171717] py-2"
                >
                  Program Overview
                </Link>
                <Link
                  href="/partners/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-mono uppercase tracking-[0.071em] text-center text-[#171717] border border-[#ebebeb] py-2.5 rounded-[6px] hover:bg-[#fafafa]"
                >
                  Partner Log In
                </Link>
                <Link
                  href="/partners/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-mono uppercase tracking-[0.071em] text-center text-white bg-[#171717] py-2.5 rounded-[6px] hover:bg-black"
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
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ebebeb] px-2 py-1 md:hidden pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-xs"
        >
          <div className="grid grid-cols-5 items-center">
            {/* 1. Dashboard */}
            <Link
              href="/partners/dashboard"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[6px] transition-colors ${
                pathname === '/partners/dashboard'
                  ? 'text-[#171717] font-medium'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              <LayoutDashboard size={17} strokeWidth={pathname === '/partners/dashboard' ? 2 : 1.75} />
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">Overview</span>
            </Link>

            {/* 2. Bookings */}
            <Link
              href="/partners/bookings"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[6px] transition-colors ${
                pathname === '/partners/bookings'
                  ? 'text-[#171717] font-medium'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              <CalendarDays size={17} strokeWidth={pathname === '/partners/bookings' ? 2 : 1.75} />
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">Bookings</span>
            </Link>

            {/* 3. Ledger (Commissions) */}
            <Link
              href="/partners/commissions"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[6px] transition-colors ${
                pathname === '/partners/commissions'
                  ? 'text-[#171717] font-medium'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              <Receipt size={17} strokeWidth={pathname === '/partners/commissions' ? 2 : 1.75} />
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">Ledger</span>
            </Link>

            {/* 4. Payouts */}
            <Link
              href="/partners/payouts"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[6px] transition-colors ${
                pathname === '/partners/payouts'
                  ? 'text-[#171717] font-medium'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              <Wallet size={17} strokeWidth={pathname === '/partners/payouts' ? 2 : 1.75} />
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">Payouts</span>
            </Link>

            {/* 5. Profile */}
            <Link
              href="/partners/profile"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-[6px] transition-colors ${
                pathname === '/partners/profile'
                  ? 'text-[#171717] font-medium'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              <User size={17} strokeWidth={pathname === '/partners/profile' ? 2 : 1.75} />
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">Profile</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
