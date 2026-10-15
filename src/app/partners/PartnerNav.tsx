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
  Sparkles
} from 'lucide-react';

export default function PartnerNav({ session }: { session: PartnerSessionData | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
    if (pathname === '/partners/dashboard') {
      window.dispatchEvent(new CustomEvent('open-booking-calendar'));
    } else {
      router.push('/partners/dashboard?openCalendar=true');
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.partner_code) return;
    navigator.clipboard.writeText(session.partner_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Brand Logo & Partner Badge */}
            <div className="flex items-center gap-3">
              <Link 
                href={session ? '/partners/dashboard' : '/partners'} 
                className="flex items-center gap-2 group transition-opacity hover:opacity-90"
              >
                <img
                  src="/therapick-logo-2.png"
                  alt="BookTherapick"
                  className="h-6 sm:h-7 w-auto max-w-[135px] sm:max-w-[160px] object-contain"
                />
                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
                  Partner
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            {session ? (
              <nav className="hidden md:flex items-center gap-1">
                {authNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all ${
                        isActive
                          ? 'bg-neutral-950 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={handleOpenCalendar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200/80 transition-all ml-1.5 active:scale-95"
                  title="Open interactive booking calendar"
                >
                  <CalendarDays size={13.5} className="text-neutral-700" />
                  <span>Calendar</span>
                </button>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/partners"
                  className={`text-xs font-semibold tracking-wide transition-colors ${
                    pathname === '/partners' ? 'text-neutral-950 font-bold' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/partners/login"
                  className="text-xs font-semibold tracking-wide text-neutral-700 hover:text-neutral-950 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/partners/register"
                  className="text-xs font-semibold tracking-wide text-white bg-neutral-950 hover:bg-neutral-800 px-4 py-2 rounded-lg transition-all shadow-xs"
                >
                  Become a Partner
                </Link>
              </nav>
            )}

            {/* Right Side Partner Identity / Profile Bar */}
            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
                  <div className="w-7 h-7 rounded-full bg-neutral-950 text-white text-[11px] font-bold flex items-center justify-center uppercase ring-2 ring-neutral-100">
                    {session.first_name?.[0] || 'P'}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <span className="font-semibold text-neutral-900 block truncate max-w-[120px]">
                      {session.first_name}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-mono font-semibold hover:text-neutral-900 transition-colors"
                      title="Click to copy partner code"
                    >
                      <span>#{session.partner_code}</span>
                      {copiedCode ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign out of partner portal"
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors ml-1"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : null}

            {/* Mobile Header Right (Code Badge + Hamburger Menu) */}
            <div className="flex md:hidden items-center gap-2">
              {session && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-neutral-900 active:scale-95 transition-all"
                  title="Tap to copy partner code"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>#{session.partner_code}</span>
                  {copiedCode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-neutral-400" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
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
                  Join BookTherapick
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modern Mobile App Native Bottom Navigation Bar */}
      {session && (
        <nav 
          aria-label="Mobile bottom navigation"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 py-1 md:hidden pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
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

            {/* 2. Referrals */}
            <Link
              href="/partners/referrals"
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                pathname === '/partners/referrals'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 font-medium'
              }`}
            >
              <Users size={18} strokeWidth={pathname === '/partners/referrals' ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 tracking-tight">Referrals</span>
            </Link>

            {/* 3. Calendar (Center Highlight Tab) */}
            <button
              type="button"
              onClick={handleOpenCalendar}
              className="flex flex-col items-center justify-center min-h-[46px] py-1 text-neutral-900 active:scale-95 transition-all group"
            >
              <div className="relative p-1 rounded-lg bg-neutral-100 group-hover:bg-neutral-200 border border-neutral-200 transition-colors">
                <CalendarDays size={16} strokeWidth={2.2} className="text-neutral-900" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight text-neutral-900">Calendar</span>
            </button>

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
