'use client';

import React from 'react';
import Link from 'next/link';

/**
 * THERAPICK DESIGN SYSTEM - CENTRALIZED UI COMPONENTS & TOKENS
 * Typeset terminal on white paper — Inspired by Vercel Light Design System
 */

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export const tokens = {
  colors: {
    paperWhite: '#fafafa',
    pureWhite: '#ffffff',
    hairline: '#ebebeb',
    ash: '#c9c9c9',
    smoke: '#a8a8a8',
    graphite: '#8f8f8f',
    slate: '#7d7d7d',
    stone: '#666666',
    charcoal: '#4d4d4d',
    obsidian: '#171717',
    carbon: '#000000',
    terminalGreen: '#297a3a',
    // Fallback aliases
    black: '#171717',
    primary: '#171717',
    secondary: '#4d4d4d',
    muted: '#666666',
    border: '#ebebeb',
    background: '#fafafa',
    surface: '#ffffff',
  },
  radii: {
    nav: 'rounded-[2px]',
    cards: 'rounded-[6px]',
    buttons: 'rounded-[6px]',
    pills: 'rounded-full',
    sm: 'rounded-[4px]',
    base: 'rounded-[6px]',
    md: 'rounded-[6px]',
    lg: 'rounded-[6px]',
  },
} as const;

export const btn = {
  base: 'inline-flex items-center justify-center gap-2 rounded-[6px] font-sans font-medium transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none select-none active:scale-[0.99]',
  primary: 'bg-[#171717] text-white hover:bg-[#262626] border border-[#171717]',
  secondary: 'bg-transparent text-[#4d4d4d] hover:text-[#171717] border border-[#ebebeb] hover:border-[#171717] hover:bg-[#fafafa]',
  subtle: 'bg-[#fafafa] text-[#171717] border border-[#ebebeb] hover:bg-[#ebebeb]',
  ghost: 'bg-transparent text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  link: 'text-[#171717] underline-offset-4 hover:underline p-0 bg-transparent',
  pillPrimary: 'bg-[#171717] text-white hover:bg-[#262626] rounded-full px-3.5 py-1 text-xs font-medium',
  pillGhost: 'bg-white text-[#4d4d4d] hover:text-[#171717] border border-[#ebebeb] rounded-full px-3.5 py-1 text-xs font-medium',
  // Sizing
  lg: 'h-11 px-5 text-sm',
  md: 'h-9 px-4 text-xs sm:text-[13px]',
  sm: 'h-8 px-3 text-xs',
  xs: 'h-7 px-2.5 text-[11px]',
  icon: 'h-9 w-9 p-0',
};

export const inputCls =
  'w-full h-9 rounded-[6px] border border-[#ebebeb] bg-white px-3 text-xs sm:text-[13px] text-[#171717] placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] disabled:opacity-50 transition-colors';

export const selectCls = cx(inputCls, 'cursor-pointer');

export function VercelSpinner({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={cx('animate-spin shrink-0', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface StatusPillProps {
  status: 'active' | 'paid' | 'completed' | 'approved' | 'pending' | 'ongoing' | 'cancelled' | 'rejected' | string;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const norm = (status || '').toLowerCase().trim();

  // Terminal green for success / verified
  let colorClasses = 'bg-[#fafafa] text-[#666666] border-[#ebebeb]';
  let dotColor = 'bg-[#a8a8a8]';

  if (['active', 'paid', 'paid out', 'completed', 'finished'].includes(norm)) {
    colorClasses = 'bg-[#297a3a]/10 text-[#297a3a] border-[#297a3a]/25';
    dotColor = 'bg-[#297a3a]';
  } else if (['pending', 'processing', 'awaiting treatment'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['approved', 'scheduled'].includes(norm)) {
    colorClasses = 'bg-[#171717]/5 text-[#171717] border-[#ebebeb]';
    dotColor = 'bg-[#171717]';
  } else if (['ongoing', 'in progress', 'therapist assigned', 'arrived'].includes(norm)) {
    colorClasses = 'bg-[#171717]/5 text-[#171717] border-[#ebebeb]';
    dotColor = 'bg-[#171717] animate-pulse';
  } else if (['rejected', 'declined', 'failed', 'cancelled', 'no show'].includes(norm)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  }

  const displayText = label || (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-tight font-mono',
        colorClasses,
        className
      )}
    >
      <span className={cx('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      <span>{displayText}</span>
    </span>
  );
}

export function EyebrowLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'font-mono text-[11px] uppercase tracking-[0.071em] text-[#171717] block mb-1.5',
        className
      )}
    >
      {children}
    </span>
  );
}

export function TherapickCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'bg-white border border-[#ebebeb] rounded-[6px] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TherapickSectionHeader({
  title,
  subtitle,
  eyebrow,
  badge,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between pb-3.5 border-b border-[#ebebeb] gap-4 mb-4">
      <div>
        {eyebrow && <EyebrowLabel>{eyebrow}</EyebrowLabel>}
        <div className="flex items-center gap-2">
          <h3 className="font-sans font-medium text-[#171717] text-base sm:text-lg tracking-[-0.05em]">
            {title}
          </h3>
          {badge && (
            <span className="inline-flex items-center h-5 px-1.5 rounded-[4px] border border-[#ebebeb] text-[10px] font-mono text-[#666666]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-[#4d4d4d] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
