'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Search, CheckCircle2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* White is the only surface color. Titles are black. Color is only    */
/* used inside status labels and small indicators.                     */
/* ------------------------------------------------------------------ */

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const formatIDR = (val: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0);

export const safeFormatDate = (rawDate: string | undefined | null, options?: Intl.DateTimeFormatOptions) => {
  if (!rawDate) return '';
  try {
    const cleanStr = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day).toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(rawDate);
};

export const toDateKey = (raw?: string | null) => {
  if (!raw) return '';
  const s = String(raw);
  return s.includes('T') ? s.split('T')[0] : s;
};

export const localTodayKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export const cleanPayoutRef = (ref?: string) => {
  if (!ref) return '';
  const parts = ref.split('-');
  if (parts.length >= 3) {
    const prefix = parts[0] || 'PAY';
    const pCode = parts[1].slice(0, 4);
    const tail = parts[2].slice(-4);
    return `${prefix}${pCode}${tail}`.toUpperCase();
  }
  return ref.replace(/-/g, '').toUpperCase();
};

export const btn = {
  base:
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1',
  primary: 'bg-black text-white border border-black hover:bg-[#262626]',
  secondary: 'bg-white text-black border border-[#E5E5E5] hover:border-[#A3A3A3]',
  danger: 'bg-white text-red-600 border border-[#E5E5E5] hover:border-red-300',
  link: 'bg-white text-black underline-offset-2 hover:underline',
  md: 'h-11 md:h-9 px-4 text-[13px]',
  sm: 'h-10 md:h-8 px-3 text-[13px]',
  xs: 'h-9 md:h-7 px-2.5 text-xs',
  icon: 'h-11 w-11 md:h-9 md:w-9 px-0',
};

export const inputCls =
  'w-full h-11 md:h-9 rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50';

export const selectCls = cx(inputCls, 'cursor-pointer');

export const thCls = 'h-10 px-4 text-left text-xs font-medium text-[#737373] whitespace-nowrap';
export const tdCls = 'px-4 py-3 align-middle';

/* ------------------------------------------------------------------ */
/* Status labels                                                       */
/* ------------------------------------------------------------------ */

const GREEN = { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
const AMBER = { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
const BLUE = { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
const GRAY = { cls: 'bg-white text-[#525252] border-[#D4D4D4]', dot: 'bg-[#A3A3A3]' };
const RED = { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
const TEAL = { cls: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' };
const INDIGO = { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500 animate-pulse' };

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  active: { label: 'Active', ...GREEN },
  paid: { label: 'Paid Out', cls: 'bg-black text-white border-black', dot: 'bg-white' },
  'paid out': { label: 'Paid Out', cls: 'bg-black text-white border-black', dot: 'bg-white' },
  completed: { label: 'Paid Out', cls: 'bg-black text-white border-black', dot: 'bg-white' },
  approved: { label: 'Approved', ...BLUE },
  processing: { label: 'Processing', ...BLUE },
  pending: { label: 'Pending', ...AMBER },
  ongoing: { label: 'Ongoing', ...INDIGO },
  finished: { label: 'Finished', ...TEAL },
  'awaiting treatment': { label: 'Awaiting Treatment', ...AMBER },
  suspended: { label: 'Suspended', ...GRAY },
  inactive: { label: 'Inactive', ...GRAY },
  cancelled: { label: 'Cancelled', ...GRAY },
  rejected: { label: 'Rejected', ...RED },
  declined: { label: 'Declined', ...RED },
  failed: { label: 'Failed', ...RED },
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const key = (status || '').toLowerCase().trim();
  if (key === 'paid' || key === 'paid out' || key === 'transferred' || key === 'settled') {
    return (
      <span
        className={cx(
          'inline-flex items-center gap-1 h-6 px-2.5 rounded-md bg-black text-white text-[11px] font-semibold whitespace-nowrap shadow-2xs',
          className
        )}
      >
        <span className="text-white text-xs leading-none">✓</span> Paid Out
      </span>
    );
  }
  const s = STATUS_MAP[key] || { label: status || 'Unknown', ...GRAY };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-xs font-medium whitespace-nowrap capitalize',
        s.cls,
        className
      )}
    >
      <span className={cx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function CountPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-[#E5E5E5] bg-white text-[11px] font-medium text-[#737373] tabular-nums',
        className
      )}
    >
      {children}
    </span>
  );
}

export function NewIndicator({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded border border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      {count} new
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation & filters                                                */
/* ------------------------------------------------------------------ */

export type TabItem = { id: string; label: string; count?: number; alert?: number };

export function Tabs({
  items,
  value,
  onChange,
  idPrefix,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  idPrefix: string;
  className?: string;
}) {
  return (
    <div role="tablist" className={cx('flex items-end gap-1 border-b border-[#E5E5E5] overflow-x-auto', className)}>
      {items.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              'relative -mb-px inline-flex items-center gap-2 h-11 md:h-10 px-3 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors',
              active ? 'border-black text-black' : 'border-transparent text-[#737373] hover:text-black'
            )}
          >
            <span>{t.label}</span>
            {t.count !== undefined && <CountPill className={active ? 'text-black border-[#D4D4D4]' : ''}>{t.count}</CountPill>}
            {!!t.alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-label={`${t.alert} need attention`} />}
          </button>
        );
      })}
    </div>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
  idPrefix,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto" role="group">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            id={`${idPrefix}-${o.value}`}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex items-center gap-1.5 h-10 md:h-8 px-3 rounded-lg border text-[13px] font-medium whitespace-nowrap transition-colors',
              active ? 'border-black text-black' : 'border-transparent text-[#737373] hover:text-black'
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="text-[11px] tabular-nums text-[#A3A3A3]">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <input
        id={id}
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, 'pl-9 pr-9')}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded text-[#A3A3A3] hover:text-black"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
  label,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
  label: string;
}) {
  if (total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E5E5] text-xs">
      <span className="text-[#737373]">
        <span className="text-[#171717] font-medium tabular-nums">{start}–{end}</span> of{' '}
        <span className="text-[#171717] font-medium tabular-nums">{total}</span> {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={cx(btn.base, btn.secondary, btn.xs)}
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="px-1 text-[#737373] tabular-nums">
          {page} / {pages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className={cx(btn.base, btn.secondary, btn.xs)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-10 h-10 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#A3A3A3] mb-3">
        <Inbox size={18} />
      </div>
      <p className="text-[13px] font-medium text-black">{title}</p>
      {description && <p className="text-xs text-[#737373] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-10 h-10 rounded-lg border border-red-200 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle size={18} />
      </div>
      <p className="text-[13px] font-medium text-black">Couldn&apos;t load data</p>
      <p className="text-xs text-[#737373] mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={cx(btn.base, btn.secondary, btn.sm, 'mt-3')}>
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[#F0F0F0] last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className={tdCls}>
              <div className="h-3.5 rounded bg-[#F0F0F0] animate-pulse" style={{ width: `${50 + ((r + c) % 4) * 12}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#F0F0F0]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 space-y-2">
          <div className="h-3.5 w-1/2 rounded bg-[#F0F0F0] animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-[#F0F0F0] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx('bg-white border border-[#E5E5E5] rounded-xl', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-4 md:px-5 pt-4">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-black">{title}</h3>}
            {description && <p className="text-xs text-[#737373] mt-0.5">{description}</p>}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx('px-4 md:px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-[#171717] mb-1.5">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-1.5" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#737373] mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

export function KeyValue({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F0F0F0] last:border-0">
      <dt className="text-xs text-[#737373] shrink-0 pt-0.5">{label}</dt>
      <dd className={cx('text-[13px] text-[#171717] text-right min-w-0 break-words', mono && 'font-mono')}>{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays                                                            */
/* ------------------------------------------------------------------ */

const overlayStack: string[] = [];
let savedBodyOverflow: string | null = null;

/** Scroll lock, Escape-to-close (top-most overlay only), and focus restore. */
export function useOverlay(open: boolean, onClose: () => void, containerRef?: React.RefObject<HTMLElement | null>) {
  const id = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    overlayStack.push(id);
    if (overlayStack.length === 1) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const focusTimer = window.setTimeout(() => containerRef?.current?.focus({ preventScroll: true }), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlayStack[overlayStack.length - 1] === id) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      const idx = overlayStack.lastIndexOf(id);
      if (idx >= 0) overlayStack.splice(idx, 1);
      if (overlayStack.length === 0) {
        document.body.style.overflow = savedBodyOverflow ?? '';
        savedBodyOverflow = null;
      }
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" aria-label="Close" onClick={onClose} className={cx(btn.base, btn.secondary, btn.icon)}>
      <X size={16} />
    </button>
  );
}

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

/** Full-screen white workspace with a fixed header/footer and a scrollable body. */
export function FullScreenModal({
  open,
  onClose,
  title,
  subtitle,
  meta,
  actions,
  tabs,
  footer,
  children,
  zIndex = 'z-[70]',
  onSubmit,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  zIndex?: string;
  onSubmit?: (e: React.FormEvent) => void;
  bodyClassName?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useOverlay(open, onClose, ref);
  if (!open) return null;

  const inner = (
    <>
      <header className="shrink-0 bg-white border-b border-[#E5E5E5]">
        <div className="flex items-start justify-between gap-4 px-4 md:px-8 pt-4 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id={titleId} className="text-lg md:text-xl font-semibold text-black tracking-tight truncate">
                {title}
              </h2>
              {meta}
            </div>
            {subtitle && <div className="text-[13px] text-[#737373] mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}
            <CloseButton onClose={onClose} />
          </div>
        </div>
        {actions && <div className="md:hidden flex flex-wrap items-center gap-2 px-4 pb-3">{actions}</div>}
        {tabs && <div className="px-4 md:px-8">{tabs}</div>}
      </header>
      <div className={cx('flex-1 min-h-0', bodyClassName ?? 'overflow-y-auto')}>{children}</div>
      {footer && <footer className="shrink-0 bg-white border-t border-[#E5E5E5] px-4 md:px-8 py-3">{footer}</footer>}
    </>
  );

  return (
    <Portal>
      <div className={cx('fixed inset-0 bg-white', zIndex)} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {onSubmit ? (
          <form
            ref={ref as React.RefObject<HTMLFormElement>}
            tabIndex={-1}
            noValidate
            onSubmit={onSubmit}
            className="h-full flex flex-col outline-none"
          >
            {inner}
          </form>
        ) : (
          <div ref={ref as React.RefObject<HTMLDivElement>} tabIndex={-1} className="h-full flex flex-col outline-none">
            {inner}
          </div>
        )}
      </div>
    </Portal>
  );
}

/** Full-height right drawer for contextual inspection; full-screen on mobile. */
export function Drawer({
  open,
  onClose,
  title,
  meta,
  footer,
  children,
  zIndex = 'z-[75]',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  zIndex?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  useOverlay(open, onClose, ref);
  if (!open) return null;
  return (
    <Portal>
      <div className={cx('fixed inset-0', zIndex)} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" aria-label="Close panel" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/30 cursor-default" />
        <div
          ref={ref}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 w-full sm:max-w-lg bg-white sm:border-l border-[#E5E5E5] flex flex-col outline-none shadow-xl"
        >
          <header className="shrink-0 flex items-start justify-between gap-3 px-4 md:px-6 py-4 border-b border-[#E5E5E5]">
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <h2 id={titleId} className="text-base font-semibold text-black truncate">{title}</h2>
              {meta}
            </div>
            <CloseButton onClose={onClose} />
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">{children}</div>
          {footer && <footer className="shrink-0 border-t border-[#E5E5E5] px-4 md:px-6 py-3">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}

/** Compact confirmation for consequential, single-step actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'default',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  useOverlay(open, onCancel, ref);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" aria-label="Cancel" tabIndex={-1} onClick={onCancel} className="absolute inset-0 bg-black/40 cursor-default" />
        <div ref={ref} tabIndex={-1} className="relative w-full max-w-sm bg-white border border-[#E5E5E5] rounded-xl shadow-xl outline-none">
          <div className="p-5">
            <h2 id={titleId} className="text-base font-semibold text-black">{title}</h2>
            <p className="text-[13px] text-[#737373] mt-1.5">{description}</p>
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E5E5E5]">
            <button type="button" onClick={onCancel} className={cx(btn.base, btn.secondary, btn.sm)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={cx(btn.base, tone === 'danger' ? 'bg-red-600 text-white border border-red-600 hover:bg-red-700' : btn.primary, btn.sm)}
            >
              {loading ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' } | null }) {
  if (!toast) return null;
  return (
    <Portal>
      <div
        role="status"
        aria-live="polite"
        className="fixed z-[100] bottom-24 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm flex items-center gap-2.5 px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl shadow-lg text-[13px] text-[#171717]"
      >
        {toast.type === 'success' ? (
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle size={16} className="text-red-600 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </Portal>
  );
}
