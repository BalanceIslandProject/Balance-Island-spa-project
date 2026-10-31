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
    <div className="min-h-screen w-full bg-[#faf8f5] text-neutral-900 font-sans antialiased relative selection:bg-amber-300 selection:text-neutral-950 flex flex-col">
      {/* Crextio Warm Ambient Backlight Glows */}
      <div 
        className="fixed top-0 right-0 w-[650px] h-[400px] bg-gradient-to-br from-amber-200/35 via-yellow-100/20 to-transparent blur-3xl pointer-events-none -z-0" 
        aria-hidden="true"
      />
      <div 
        className="fixed bottom-0 left-0 w-[550px] h-[350px] bg-gradient-to-tr from-amber-100/20 via-stone-100/15 to-transparent blur-3xl pointer-events-none -z-0" 
        aria-hidden="true"
      />

      {/* True Full-Screen CRM Layout */}
      <div className="relative z-10 w-full flex-1 flex flex-col px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4">
        
        {/* ═══════════════════════════════════════════════════════════════
            CREXTIO CRM TOP NAVIGATION BAR (Full-Width Edge-to-Edge)
           ═══════════════════════════════════════════════════════════════ */}
        <header className="w-full bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Brand Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-200/90 bg-stone-50/70 shadow-2xs hover:border-amber-400 hover:bg-white transition-colors cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold tracking-tight text-neutral-900">Therapick CRM</span>
              <span className="text-[10px] font-mono font-medium text-stone-600 bg-stone-200/70 px-1.5 py-0.5 rounded-full">Admin</span>
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
            SECTION CONTENT (Full-Width Responsive Canvas)
           ═══════════════════════════════════════════════════════════════ */}
        <main className="w-full flex-1 min-w-0">
          {children}
        </main>

      </div>
    </div>
  );
}
