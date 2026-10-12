'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  CreditCard, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink,
  Sparkles
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

  const authNavItems = [
    { href: '/partners/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/partners/referrals', label: 'Referrals', icon: Users },
    { href: '/partners/commissions', label: 'Commissions', icon: Coins },
    { href: '/partners/payouts', label: 'Payouts', icon: CreditCard },
    { href: '/partners/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href={session ? '/partners/dashboard' : '/partners'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A1A1A] to-[#3A3530] text-amber-200 flex items-center justify-center font-serif text-lg font-bold shadow-sm group-hover:scale-105 transition-transform">
                T
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg tracking-tight font-bold text-[#1A1A1A] leading-tight">
                  BookTherapick
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-800 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Partner Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          {session ? (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {authNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                        : 'text-[#5C554D] hover:text-[#1A1A1A] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/partners"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/partners' ? 'text-[#1A1A1A] font-semibold' : 'text-[#6B645C] hover:text-[#1A1A1A]'
                }`}
              >
                Overview
              </Link>
              <Link
                href="/partners/login"
                className="text-sm font-semibold text-[#1A1A1A] px-4 py-2 rounded-lg hover:bg-[#F5F2EB] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/partners/register"
                className="text-sm font-semibold text-white bg-[#1A1A1A] hover:bg-[#333] px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                Join Program
              </Link>
            </nav>
          )}

          {/* Right Side Info / Controls */}
          {session ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#1A1A1A]">{session.first_name}</p>
                <p className="text-[11px] text-amber-800 font-mono font-medium">#{session.partner_code}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Log out"
                className="p-2 text-[#736B63] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#1A1A1A] hover:bg-[#F5F2EB]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E2D9] bg-white px-4 pt-3 pb-5 space-y-2">
          {session ? (
            <>
              <div className="pb-3 border-b border-[#F0EBE1] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{session.first_name}</p>
                  <p className="text-xs text-amber-800 font-mono">#{session.partner_code}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-red-600 font-medium px-2.5 py-1 rounded bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log out
                </button>
              </div>

              {authNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1A1A1A] text-white font-semibold'
                        : 'text-[#4A443D] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="space-y-3 pt-2">
              <Link
                href="/partners"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-[#1A1A1A] py-1.5"
              >
                Overview
              </Link>
              <Link
                href="/partners/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-center text-[#1A1A1A] bg-[#F5F2EB] py-2 rounded-lg"
              >
                Log In
              </Link>
              <Link
                href="/partners/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-center text-white bg-[#1A1A1A] py-2 rounded-lg"
              >
                Join Program
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
