'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerSessionData } from '@/lib/partnerAuth';
import { 
  Share2, 
  Bell, 
  Check, 
  Copy, 
  RotateCw,
  Plus,
  X,
  Sparkles
} from 'lucide-react';

export default function PartnerTopBar({ session }: { session: PartnerSessionData | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    router.refresh();
    window.dispatchEvent(new Event('partner:refresh'));
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const getPageTitle = () => {
    if (pathname.includes('/partners/bookings')) return 'Bookings';
    if (pathname.includes('/partners/commissions')) return 'Commissions';
    if (pathname.includes('/partners/payouts')) return 'Payouts';
    if (pathname.includes('/partners/history')) return 'History';
    if (pathname.includes('/partners/settings') || pathname.includes('/partners/profile')) return 'Settings';
    return 'Overview';
  };

  const partnerCode = session?.partner_code || 'BALIHEAD112';
  const partnerFirstName = session?.first_name || 'Partner';

  const handleCopyLink = () => {
    const link = `https://www.booktherapick.com/?ref=${partnerCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Formatted current date like Cirrel: "Sunday, November 2"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="cirrel-top hidden md:block">
      <div className="cirrel-top__in">
        
        {/* Left: Greeting & Status Dot */}
        <div className="cirrel-top__hello">
          <b>{greeting}, {partnerFirstName}</b>
          <small>
            <span className="cirrel-live"></span>
            {formattedDate} · {getPageTitle()} · Live Sync
          </small>
        </div>

        {/* Right: Action Tools */}
        <div className="cirrel-tools">
          
          {/* Quick Referral Link Pill Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="cirrel-btn"
            style={{ height: '42px', padding: '0 14px' }}
            title="Click to copy unique referral link"
          >
            <Share2 size={14} className="opacity-70" />
            <span className="font-mono text-xs opacity-90">ref={partnerCode}</span>
            {copiedLink ? (
              <span className="flex items-center gap-1 text-[var(--good)] font-bold text-xs ml-1">
                <Check size={13} /> Copied!
              </span>
            ) : (
              <Copy size={12} className="opacity-50 ml-1" />
            )}
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="cirrel-ibtn"
            title="Refresh portal data"
            aria-label="Refresh portal data"
          >
            <RotateCw size={17} className={refreshing ? 'animate-spin text-[var(--accent)]' : ''} />
          </button>

          {/* Notifications Button with Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="cirrel-ibtn"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="cirrel-ibtn__badge">1</span>
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2.5 w-80 cirrel-card shadow-2xl z-50 text-xs"
                style={{ borderRadius: '18px', padding: '16px' }}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[var(--line)] mb-3">
                  <span className="font-bold text-[var(--ink)] text-sm">Notifications</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--line)]">
                  <div className="flex items-center gap-1.5 text-[var(--good)] font-semibold text-xs mb-1">
                    <Check size={13} /> Real-time Attribution Live
                  </div>
                  <p className="text-[var(--muted)] leading-relaxed">
                    Bookings referred via your link <code className="text-[var(--accent-text)]">?ref={partnerCode}</code> are automatically credited to your ledger.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button (+ Book Client) */}
          <a
            href={`https://www.booktherapick.com/?ref=${partnerCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cirrel-btn cirrel-btn--accent"
            style={{ height: '42px', padding: '0 18px' }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Book Client</span>
          </a>
        </div>
      </div>
    </header>
  );
}
