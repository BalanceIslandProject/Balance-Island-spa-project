'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, ExternalLink } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

interface Props {
  liveSiteUrl: string;
}

export default function TherapickTopNavControls({ liveSiteUrl }: Props) {
  const { unreadNotificationCount, setIsNotificationCenterOpen } = useTherapickAdmin();

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <Link
        href={liveSiteUrl || 'https://booktherapick.com'}
        target="_blank"
        rel="noreferrer"
        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs"
        title="Open Live Website"
      >
        <span>Live Site</span>
        <ExternalLink size={12} className="text-stone-400" />
      </Link>

      {/* Notifications Button */}
      <button
        type="button"
        onClick={() => setIsNotificationCenterOpen(true)}
        className="w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-700 relative shadow-2xs transition-colors cursor-pointer"
        title="Open Notification Center"
        aria-label="Notifications"
      >
        <Bell size={14} />
        {unreadNotificationCount > 0 ? (
          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white absolute top-1.5 right-1.5 animate-pulse" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-stone-300 ring-2 ring-white absolute top-1.5 right-1.5" />
        )}
      </button>

      {/* Admin Profile Circle */}
      <div 
        className="w-8 h-8 rounded-full bg-neutral-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs cursor-default select-none tracking-wider"
        title="Therapick Administrator"
      >
        TP
      </div>
    </div>
  );
}
