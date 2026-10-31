'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Bell, ExternalLink, Sparkles } from 'lucide-react';

interface AdminCrmShellProps {
  children: React.ReactNode;
}

const CRM_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/partners', label: 'Partners' },
  { href: '/admin/commissions', label: 'Commissions' },
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminCrmShell({ children }: AdminCrmShellProps) {
  const pathname = usePathname();

  // Keep /admin/login standalone without the CRM shell
  if (pathname.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 font-sans antialiased relative selection:bg-amber-300 selection:text-neutral-950">
      {/* Crextio Warm Ambient Backlight Glows */}
      <div 
        className="fixed top-0 right-0 w-[550px] h-[380px] bg-gradient-to-br from-amber-200/45 via-yellow-100/30 to-transparent blur-3xl pointer-events-none -z-0" 
        aria-hidden="true"
      />
      <div 
        className="fixed bottom-0 left-0 w-[450px] h-[300px] bg-gradient-to-tr from-amber-100/25 via-stone-100/20 to-transparent blur-3xl pointer-events-none -z-0" 
        aria-hidden="true"
      />

      {/* Main Floating CRM Container */}
      <div className="relative z-10 max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-7">
        <div className="bg-[#fcfbf9]/95 border border-amber-200/60 rounded-[28px] sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(180,140,75,0.08)] backdrop-blur-md p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* ═══════════════════════════════════════════════════════════════
              CREXTIO CRM TOP NAVIGATION BAR
             ═══════════════════════════════════════════════════════════════ */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-stone-200/60">
            {/* Left: Brand Badge */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-200/90 bg-white shadow-2xs hover:border-amber-400 transition-colors cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold tracking-tight text-neutral-900">Therapick CRM</span>
                <span className="text-[10px] font-mono font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full">Admin</span>
              </Link>
            </div>

            {/* Center: Segmented Navigation Pills */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 shrink-0" aria-label="Admin Navigation">
              {CRM_NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-100/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200/80 bg-white text-xs font-medium text-stone-600 hover:text-neutral-900 hover:border-stone-300 transition-colors shadow-2xs"
                title="View live website"
              >
                <span>Live Site</span>
                <ExternalLink size={11} />
              </Link>

              <Link
                href="/admin/settings"
                className="w-8 h-8 rounded-full border border-stone-200/80 bg-white flex items-center justify-center text-stone-600 hover:text-neutral-900 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
                title="CRM Settings"
                aria-label="CRM Settings"
              >
                <Settings size={14} />
              </Link>

              <button
                type="button"
                className="w-8 h-8 rounded-full border border-stone-200/80 bg-white flex items-center justify-center text-stone-600 hover:text-neutral-900 hover:bg-stone-50 transition-colors shadow-2xs relative cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={14} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-2 right-2" />
              </button>

              <div 
                className="w-8 h-8 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center shadow-xs cursor-default"
                title="Admin Account"
              >
                TP
              </div>
            </div>
          </header>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION CONTENT
             ═══════════════════════════════════════════════════════════════ */}
          <main className="min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
