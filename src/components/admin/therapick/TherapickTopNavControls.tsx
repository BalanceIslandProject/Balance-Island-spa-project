'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, ExternalLink, Plus, Search } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

interface Props {
  liveSiteUrl: string;
}

export default function TherapickTopNavControls({ liveSiteUrl }: Props) {
  const { unreadNotificationCount, setIsNotificationCenterOpen, setIsAddBookingOpen } = useTherapickAdmin();

  return (
    <div className="fitlo-top__right">
      {/* Fitlo Search Pill */}
      <div 
        className="fitlo-searchpill hidden xl:flex"
        onClick={() => {
          const input = document.getElementById('admin-global-search');
          if (input) input.focus();
        }}
        title="Search bookings, partners, therapists"
      >
        <Search size={16} />
        <span>Search bookings, partners...</span>
        <span className="fitlo-kbd">⌘K</span>
      </div>

      {/* Live Site Link */}
      <Link
        href={liveSiteUrl || 'https://booktherapick.com'}
        target="_blank"
        rel="noreferrer"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--fitlo-line-2)] bg-[var(--fitlo-card)] hover:bg-[var(--fitlo-card-2)] text-xs font-semibold text-[var(--fitlo-ink)] transition-colors shadow-xs"
        title="Open Live Website"
      >
        <span>Live Site</span>
        <ExternalLink size={12} className="text-[var(--fitlo-muted)]" />
      </Link>

      {/* Fitlo Notifications Button */}
      <button
        type="button"
        onClick={() => setIsNotificationCenterOpen(true)}
        className="fitlo-ibtn"
        title="Open Notification Center"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadNotificationCount > 0 && (
          <span className="fitlo-ibtn__badge">
            {unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Primary Action Button: + New Booking */}
      <button
        type="button"
        onClick={() => setIsAddBookingOpen(true)}
        className="fitlo-btn fitlo-btn--primary hidden sm:inline-flex"
        title="Create New Booking"
      >
        <Plus size={16} strokeWidth={2.4} />
        <span>+ New</span>
      </button>

      {/* Fitlo Admin Profile Pill */}
      <div 
        className="fitlo-me"
        title="Therapick Administrator"
      >
        <div className="fitlo-av">TP</div>
        <span className="text-xs font-semibold hidden md:inline">Admin</span>
      </div>
    </div>
  );
}
