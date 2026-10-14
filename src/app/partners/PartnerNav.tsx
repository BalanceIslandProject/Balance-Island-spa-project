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
  ShieldCheck
} from 'lucide-react';

export default function PartnerNav({ session }: { session: PartnerSessionData | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const authNavItems = [
    { href: '/partners/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/partners/referrals', label: 'Referrals', icon: Users },
    { href: '/partners/commissions', label: 'Commissions', icon: Receipt },
    { href: '/partners/payouts', label: 'Payouts', icon: Receipt },
    { href: '/partners/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link href={session ? '/partners/dashboard' : '/partners'} className="flex items-center gap-2 group">
                <img
                  src="/therapick-logo-2.png"
                  alt="BookTherapick"
                  className="h-7 sm:h-8 w-auto max-w-[130px] sm:max-w-[155px] object-contain"
                />
                <span className="text-[10px] uppercase tracking-wider font-bold text-black bg-black/[0.04] border border-black/10 px-2 py-0.5 rounded-full">
                  Partners
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            {session ? (
              <nav className="hidden md:flex items-center gap-1">
                {authNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? 'bg-black text-white shadow-xs'
                          : 'text-black/70 hover:text-black hover:bg-black/5'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <button
                  onClick={handleOpenCalendar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all ml-1 active:scale-95"
                >
                  <CalendarDays size={14} className="text-emerald-700" />
                  <span>Calendar</span>
                </button>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/partners"
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    pathname === '/partners' ? 'text-black' : 'text-black/60 hover:text-black'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/partners/login"
                  className="text-xs font-semibold uppercase tracking-wider text-black/70 hover:text-black transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/partners/register"
                  className="text-xs font-semibold uppercase tracking-wider text-white bg-black hover:bg-black/85 px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  Become a Partner
                </Link>
              </nav>
            )}

            {/* Right Side Partner Info */}
            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 border-l border-black/10">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center uppercase">
                    {session.first_name?.[0] || 'P'}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <span className="font-bold text-black block truncate max-w-[120px]">
                      {session.first_name}
                    </span>
                    <span className="text-[10px] text-black/50 font-mono font-bold block">
                      #{session.partner_code}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign out of partner portal"
                  className="p-2 text-black/50 hover:text-black hover:bg-black/5 rounded-xl transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : null}

            {/* Mobile menu button (for unauthenticated or quick dropdown) */}
            <div className="flex md:hidden items-center gap-2">
              {session && (
                <div className="flex items-center gap-1.5 bg-black/[0.04] border border-black/10 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>#{session.partner_code}</span>
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-black hover:bg-black/5 rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Top Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/10 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {session ? (
              <>
                <div className="pb-3 border-b border-black/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center uppercase">
                      {session.first_name?.[0] || 'P'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-black block">
                        {session.first_name}
                      </span>
                      <span className="text-[11px] text-black/50 font-mono font-semibold">
                        Code: {session.partner_code}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-xs text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Log out
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
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-black text-white' 
                            : 'text-black/80 hover:bg-black/5 border border-black/5'
                        }`}
                      >
                        <Icon size={15} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <Link
                  href="/partners"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold uppercase tracking-wider text-black py-2"
                >
                  Program Overview
                </Link>
                <Link
                  href="/partners/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-bold uppercase tracking-wider text-center text-black border border-black/20 py-2.5 rounded-xl hover:bg-black/5"
                >
                  Partner Log In
                </Link>
                <Link
                  href="/partners/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-bold uppercase tracking-wider text-center text-white bg-black py-2.5 rounded-xl hover:bg-neutral-800 shadow-xs"
                >
                  Join BookTherapick
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modern Mobile App Bottom Navigation Dock (Native App Look) */}
      {session && (
        <nav 
          aria-label="Mobile app navigation"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/10 py-1.5 px-3 flex items-center justify-around md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        >
          <Link
            href="/partners/dashboard"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/partners/dashboard'
                ? 'text-black font-bold scale-105'
                : 'text-black/50 hover:text-black font-medium'
            }`}
          >
            <LayoutDashboard size={19} strokeWidth={pathname === '/partners/dashboard' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 tracking-tight">Dashboard</span>
          </Link>

          {/* Floating Calendar trigger tab */}
          <button
            onClick={handleOpenCalendar}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-emerald-800 hover:text-emerald-950 font-bold active:scale-95 transition-all"
          >
            <div className="relative">
              <CalendarDays size={19} strokeWidth={2.3} />
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Calendar</span>
          </button>

          <Link
            href="/partners/referrals"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/partners/referrals'
                ? 'text-black font-bold scale-105'
                : 'text-black/50 hover:text-black font-medium'
            }`}
          >
            <Users size={19} strokeWidth={pathname === '/partners/referrals' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 tracking-tight">Referrals</span>
          </Link>

          <Link
            href="/partners/commissions"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/partners/commissions'
                ? 'text-black font-bold scale-105'
                : 'text-black/50 hover:text-black font-medium'
            }`}
          >
            <Receipt size={19} strokeWidth={pathname === '/partners/commissions' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 tracking-tight">Ledger</span>
          </Link>

          <Link
            href="/partners/profile"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              pathname === '/partners/profile'
                ? 'text-black font-bold scale-105'
                : 'text-black/50 hover:text-black font-medium'
            }`}
          >
            <User size={19} strokeWidth={pathname === '/partners/profile' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 tracking-tight">Profile</span>
          </Link>
        </nav>
      )}
    </>
  );
}
