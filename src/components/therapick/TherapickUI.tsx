'use client';

import React from 'react';
import Link from 'next/link';

/**
 * THERAPICK DESIGN SYSTEM - CENTRALIZED UI COMPONENTS & TOKENS
 * Strict Apple-inspired minimalist standard adhering to DESIGN.md
 */

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export const tokens = {
  colors: {
    black: '#000000',
    primary: '#171717',
    secondary: '#737373',
    muted: '#A3A3A3',
    border: '#E5E5E5',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    subtleBg: '#FAFAFA',
    subtleHover: '#F5F5F5',
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    warningBorder: '#FDE68A',
    danger: '#DC2626',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FECACA',
    info: '#2563EB',
    infoBg: '#EFF6FF',
    infoBorder: '#BFDBFE',
  },
  radii: {
    sm: 'rounded-md',    // 6px
    base: 'rounded-lg',  // 8px - standard controls, buttons, inputs
    md: 'rounded-xl',    // 12px - cards, dropdowns
    lg: 'rounded-2xl',   // 16px - modals, hero panels
  },
} as const;

export const btn = {
  base: 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 select-none active:scale-[0.99]',
  primary: 'bg-black text-white hover:bg-[#262626] border border-black shadow-2xs',
  secondary: 'bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5]',
  subtle: 'bg-[#F5F5F5] text-black hover:bg-[#E5E5E5]',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  link: 'text-black underline-offset-4 hover:underline p-0 bg-transparent',
  // Sizing
  lg: 'h-11 px-5 text-sm',
  md: 'h-10 sm:h-9 px-4 text-xs sm:text-[13px]',
  sm: 'h-8 px-3 text-xs',
  xs: 'h-7 px-2.5 text-[11px]',
  icon: 'h-9 w-9 p-0',
};

export const inputCls =
  'w-full h-11 sm:h-9 rounded-lg border border-[#E5E5E5] bg-white px-3 text-xs sm:text-[13px] text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50 transition-colors';

export const selectCls = cx(inputCls, 'cursor-pointer');

export interface StatusPillProps {
  status: 'active' | 'paid' | 'completed' | 'approved' | 'pending' | 'ongoing' | 'cancelled' | 'rejected' | string;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const norm = (status || '').toLowerCase().trim();

  let colorClasses = 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]';
  let dotColor = 'bg-[#A3A3A3]';

  if (['active', 'paid', 'paid out', 'completed', 'finished'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['pending', 'processing', 'awaiting treatment'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['approved', 'scheduled'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (['ongoing', 'in progress', 'therapist assigned', 'arrived'].includes(norm)) {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500 animate-pulse';
  } else if (['rejected', 'declined', 'failed', 'cancelled', 'no show'].includes(norm)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  }

  const displayText = label || (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-medium tracking-tight',
        colorClasses,
        className
      )}
    >
      <span className={cx('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      <span>{displayText}</span>
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
    <div className={cx('bg-white border border-[#E5E5E5] rounded-xl p-4 sm:p-5 shadow-2xs', className)}>
      {children}
    </div>
  );
}

export function TherapickSectionHeader({
  title,
  subtitle,
  badge,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E5] gap-4 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-black text-sm sm:text-[15px] tracking-tight">{title}</h3>
          {badge && (
            <span className="inline-flex items-center h-5 px-1.5 rounded border border-[#E5E5E5] text-[10px] font-mono text-[#737373]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-[#737373] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
