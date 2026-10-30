'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Receipt, 
  Wallet, 
  Share2, 
  Settings, 
  Bell, 
  MessageCircle, 
  Check, 
  Copy, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function PartnerTopBar({ session }: { session: PartnerSessionData | null }) {
  const pathname = usePathname();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic Kravio Breadcrumb based on route
  const getBreadcrumb = () => {
    if (pathname.includes('/partners/bookings')) {
      return { section: 'Operations', page: 'Bookings & Calendar', icon: CalendarDays };
    }
    if (pathname.includes('/partners/commissions')) {
      return { section: 'Finance', page: 'Commissions Ledger', icon: Receipt };
    }
    if (pathname.includes('/partners/payouts')) {
      return { section: 'Finance', page: 'Payouts & Transfers', icon: Wallet };
    }
    if (pathname.includes('/partners/referrals')) {
      return { section: 'Growth', page: 'Referral & QR Hub', icon: Share2 };
    }
    if (pathname.includes('/partners/profile') || pathname.includes('/partners/settings')) {
      return { section: 'Account', page: 'Settings & Security', icon: Settings };
    }
    return { section: 'Overview', page: 'Dashboard', icon: LayoutDashboard };
  };

  const breadcrumb = getBreadcrumb();
  const Icon = breadcrumb.icon;

  const handleCopyLink = () => {
    if (!session?.partner_code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.booktherapick.com';
    const mainOrigin = origin.includes('partners.') 
      ? origin.replace('partners.', 'www.') 
      : 'https://www.booktherapick.com';
    const link = `${mainOrigin}/?ref=${session.partner_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const partnerInitials = `${session?.first_name?.[0] || 'P'}${session?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <header className="h-16 px-4 sm:px-6 md:px-8 border-b border-[#e5e7eb] bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
      
      {/* Left: Kravio-style Small Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <div className="w-6 h-6 rounded-[5px] bg-[#f3f4f6] text-[#374151] flex items-center justify-center">
          <Icon size={13} />
        </div>
        <span className="font-medium text-[#6b7280]">{breadcrumb.section}</span>
        <span className="text-[#d1d5db]">/</span>
        <span className="font-semibold text-[#111827]">{breadcrumb.page}</span>
      </div>

      {/* Right: Quick Tools, Notifications, Support, Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Quick Referral Link Copy (Desktop) */}
        {session?.partner_code && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] text-xs font-mono text-[#374151] hover:text-[#111827] transition-all cursor-pointer"
            title="Copy unique referral link"
          >
            <Share2 size={12} className="text-[#6b7280]" />
            <span className="truncate max-w-[120px]">ref={session.partner_code}</span>
            {copiedLink ? (
              <span className="text-[#16a34a] font-semibold flex items-center gap-0.5 text-[10px]">
                <Check size={11} /> Copied
              </span>
            ) : (
              <Copy size={11} className="text-[#9ca3af]" />
            )}
          </button>
        )}

        {/* WhatsApp Concierge Support */}
        <a
          href="https://wa.me/6285174119423"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-[6px] transition-colors border border-transparent hover:border-[#e5e7eb]"
          title="WhatsApp Partner Concierge"
          aria-label="WhatsApp Concierge"
        >
          <MessageCircle size={16} />
        </a>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-[6px] transition-colors relative border border-transparent hover:border-[#e5e7eb] cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#16a34a] ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[8px] border border-[#e5e7eb] shadow-lg p-3 space-y-2 z-50 text-xs animate-in fade-in-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
                <span className="font-semibold text-[#111827]">Partner Notifications</span>
                <span className="text-[10px] text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px] font-mono">Live</span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2 rounded-[6px] bg-[#f9fafb] border border-[#e5e7eb]">
                  <p className="font-medium text-[#111827]">Automated Booking Attribution Active</p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">Guest referrals are tracked with instant commission settlements.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Pill */}
        {session && (
          <Link
            href="/partners/profile"
            className="flex items-center gap-2 pl-2 border-l border-[#e5e7eb] hover:opacity-85 transition-opacity"
            title="Account Settings"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#111827] text-white text-xs font-semibold flex items-center justify-center">
                {partnerInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#16a34a] ring-2 ring-white" />
            </div>
          </Link>
        )}

      </div>
    </header>
  );
}
