'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { Menu, X } from 'lucide-react';

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
    { href: '/partners/dashboard', label: 'Dashboard' },
    { href: '/partners/referrals', label: 'Referrals' },
    { href: '/partners/commissions', label: 'Commissions' },
    { href: '/partners/payouts', label: 'Payouts' },
    { href: '/partners/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href={session ? '/partners/dashboard' : '/partners'} className="flex items-center gap-2.5 group">
              <img
                src="/therapick-logo-2.png"
                alt="BookTherapick"
                className="h-7 sm:h-8 w-auto max-w-[130px] sm:max-w-[160px] object-contain"
              />
              <span className="text-[10px] uppercase tracking-wider font-bold text-black/60 bg-black/[0.04] border border-black/10 px-2 py-0.5 rounded-full">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                      isActive
                        ? 'bg-black text-white'
                        : 'text-black/70 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
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
                className="text-xs font-semibold uppercase tracking-wider text-white bg-black hover:bg-black/80 px-4 py-2 rounded-lg transition-colors"
              >
                Become a Partner
              </Link>
            </nav>
          )}

          {/* Right Side Partner Info */}
          {session ? (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-semibold text-black block">{session.first_name}</span>
                <span className="text-[11px] text-black/50 font-mono">#{session.partner_code}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-xs font-semibold text-black/60 hover:text-black px-2.5 py-1 rounded border border-black/15 hover:border-black transition-colors"
              >
                Log out
              </button>
            </div>
          ) : null}

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-black hover:bg-black/5 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/10 bg-white px-4 py-4 space-y-2">
          {session ? (
            <>
              <div className="pb-3 border-b border-black/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-black block">{session.first_name}</span>
                  <span className="text-[11px] text-black/50 font-mono">#{session.partner_code}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-black/70 font-semibold px-2.5 py-1 rounded border border-black/15"
                >
                  Log out
                </button>
              </div>

              {authNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="space-y-3 pt-1">
              <Link
                href="/partners"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-black py-1.5"
              >
                Overview
              </Link>
              <Link
                href="/partners/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-center text-black border border-black/20 py-2.5 rounded-lg"
              >
                Log In
              </Link>
              <Link
                href="/partners/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-center text-white bg-black py-2.5 rounded-lg"
              >
                Become a Partner
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
