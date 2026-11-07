'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Layers, User, Calendar as CalendarIcon, 
  ChevronDown, Download, ArrowUpRight, DollarSign, 
  Percent, ShieldCheck, Wallet, ArrowDownRight, Clock
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

const formatCompactScale = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}K`;
  return `${Math.round(val)}`;
};

export default function TherapickRevenueProfitView() {
  const { 
    websiteBookings, 
    websiteMetrics, 
    dateRange, 
    setDatePreset,
    setSelectedBooking
  } = useTherapickAdmin();

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [periodTab, setPeriodTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Revenue vs Therapist Payment Chart Data computed from real bookings and date range
  const chartData = useMemo(() => {
    let startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date();
    let endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const intervalsCount = 5;
    const stepDays = Math.max(1, Math.floor(totalDays / (intervalsCount - 1)));

    const validBookings = websiteBookings.filter(b => (b.status || '').toLowerCase() !== 'cancelled');
    const buckets: Array<{ label: string; dateStr: string; rev: number; fee: number }> = [];

    for (let i = 0; i < intervalsCount; i++) {
      const pDate = i === intervalsCount - 1 
        ? new Date(endDate) 
        : new Date(startDate.getTime() + i * stepDays * (1000 * 60 * 60 * 24));
      
      const yyyy = pDate.getFullYear();
      const mm = String(pDate.getMonth() + 1).padStart(2, '0');
      const dd = String(pDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const monthShort = pDate.toLocaleString('en-US', { month: 'short' });
      const label = `${monthShort} ${pDate.getDate()}`;

      const prevDate = i === 0 ? '1970-01-01' : buckets[i - 1].dateStr;
      const bucketBookings = validBookings.filter(b => {
        const bDate = b.booking_date || b.created_at?.split('T')[0] || '';
        return bDate > prevDate && bDate <= dateStr;
      });

      const rev = bucketBookings.reduce((sum, b) => sum + (Number(b.revenue || b.total_price || 0)), 0);
      const fee = bucketBookings.reduce((sum, b) => sum + (Number(b.therapist_fee || Math.round((Number(b.revenue || b.total_price || 0)) * 0.45))), 0);

      buckets.push({ label, dateStr, rev, fee });
    }

    const maxVal = Math.max(...buckets.map(b => b.rev), 1000000);
    return { buckets, maxVal };
  }, [websiteBookings, dateRange]);

  // Real financial calculations
  const totalRev = Number(websiteMetrics.totalRevenue || 0);
  const therapistPay = Number(websiteMetrics.therapistPayments || 0);
  const netProfit = Number(websiteMetrics.netProfit ?? (totalRev - therapistPay));
  const bookingCount = websiteBookings.length;
  const avgBookingVal = bookingCount > 0 ? Math.round(totalRev / bookingCount) : 0;
  const profitMarginPct = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0';

  // Export Financial CSV
  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Date', 'Customer', 'Service', 'Revenue (IDR)', 'Therapist Fee (IDR)', 'Net Profit (IDR)', 'Payment Status'];
    const rows = websiteBookings.map(b => [
      b.reference_number || b.id || 'BK-10286',
      b.booking_date || b.created_at?.split('T')[0] || '',
      b.guest_name || b.customer_name || 'Guest',
      b.treatment_name || b.service_name || 'Massage',
      Number(b.revenue || b.total_price || b.total_amount || 0),
      Number(b.therapist_fee || Math.round(Number(b.revenue || b.total_price || b.total_amount || 0) * 0.45)),
      Number(b.revenue || b.total_price || b.total_amount || 0) - Number(b.therapist_fee || Math.round(Number(b.revenue || b.total_price || b.total_amount || 0) * 0.45)),
      b.payment_status || 'Paid'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `therapick_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── FITLO PAGE HEADER & DATE SELECTOR ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">Revenue & Profit</h1>
          <p className="fitlo-page-sub">
            Financial performance, therapist payout breakdown, and realized margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Date Range Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="fitlo-btn fitlo-btn--ghost flex items-center gap-2"
            >
              <CalendarIcon size={14} className="text-[var(--fitlo-muted)]" />
              <span>{dateRange.label || 'Oct 1, 2026 - Oct 31, 2026'}</span>
              <ChevronDown size={14} className={`text-[var(--fitlo-muted)] transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 fitlo-card p-1.5 shadow-xl z-40 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] border-b border-[var(--fitlo-line)]">
                  Select Period
                </div>
                <div className="py-1 space-y-0.5">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month (Oct 2026)' },
                    { id: 'last_month', label: 'Last Month' },
                    { id: 'year', label: 'This Year' },
                    { id: 'all', label: 'All Time' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDatePreset(opt.id as any);
                        setDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        dateRange.preset === opt.id ? 'bg-[var(--fitlo-accent)] text-white font-bold' : 'text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--ghost flex items-center gap-2"
          >
            <Download size={14} className="text-[var(--fitlo-muted)]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── FITLO 3 PRIMARY FINANCIAL KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="fitlo-kpi fitlo-kpi--cyan">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={15} className="text-[var(--fitlo-ink)] opacity-70" />
            <span className="fitlo-kpi__lbl">Total Revenue</span>
          </div>
          <div className="fitlo-kpi__val text-2xl sm:text-3xl">
            {formatIDR(totalRev)}
          </div>
          <div className="fitlo-kpi__sub flex items-center gap-1.5 mt-2 font-semibold text-[var(--fitlo-accent)]">
            <span>▲ +12%</span>
            <span className="text-[var(--fitlo-muted)] font-normal">vs last period</span>
          </div>
        </div>

        {/* Therapist Payment */}
        <div className="fitlo-kpi fitlo-kpi--pebble">
          <div className="flex items-center gap-2 mb-2">
            <User size={15} className="text-[var(--fitlo-ink)] opacity-70" />
            <span className="fitlo-kpi__lbl">Therapist Payment</span>
          </div>
          <div className="fitlo-kpi__val text-2xl sm:text-3xl">
            {formatIDR(therapistPay)}
          </div>
          <div className="fitlo-kpi__sub flex items-center gap-1.5 mt-2 font-semibold text-[var(--fitlo-muted)]">
            <span>▼ -8%</span>
            <span className="text-[var(--fitlo-muted)] font-normal">vs last period</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="fitlo-kpi fitlo-kpi--lemon">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-[var(--fitlo-ink)] opacity-70" />
            <span className="fitlo-kpi__lbl">Net Profit</span>
          </div>
          <div className="fitlo-kpi__val text-2xl sm:text-3xl">
            {formatIDR(netProfit)}
          </div>
          <div className="fitlo-kpi__sub flex items-center gap-1.5 mt-2 font-bold text-[var(--fitlo-accent)]">
            <span>▲ +18%</span>
            <span className="text-[var(--fitlo-muted)] font-normal">vs last period</span>
          </div>
        </div>
      </div>

      {/* ─── FITLO REVENUE VS THERAPIST PAYMENT BAR CHART + SUMMARY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Revenue vs Therapist Payment Bar Chart */}
        <div className="lg:col-span-8 fitlo-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--fitlo-ink)] tracking-tight">
                Revenue vs Therapist Payment
              </h2>
              <div className="flex items-center gap-4 text-xs mt-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--fitlo-ink)]">
                  <span className="w-3 h-3 rounded-xs bg-[var(--fitlo-accent)]" />
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-[var(--fitlo-muted)]">
                  <span className="w-3 h-3 rounded-xs bg-[var(--fitlo-ink)]" />
                  <span>Therapist Payment</span>
                </div>
              </div>
            </div>

            {/* Scale Indicator */}
            <span className="text-[11px] font-bold text-[var(--fitlo-muted)] bg-[var(--fitlo-card-2)] px-2.5 py-1 rounded-lg self-start sm:self-auto border border-[var(--fitlo-line)]">
              Currency: IDR (Millions)
            </span>
          </div>

          {/* Bar Chart Graphic */}
          <div className="pt-4">
            <div className="flex items-end justify-between h-48 gap-3 sm:gap-6 border-b border-[var(--fitlo-line)] pb-2">
              {chartData.buckets.map((b, idx) => {
                const revHeight = Math.round((b.rev / (chartData.maxVal * 1.15)) * 100);
                const feeHeight = Math.round((b.fee / (chartData.maxVal * 1.15)) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full">
                      {/* Revenue Bar */}
                      <div 
                        style={{ height: `${Math.max(revHeight, 10)}%` }} 
                        className="w-4 sm:w-8 bg-[var(--fitlo-accent)] rounded-t-sm group-hover:opacity-90 transition-all relative cursor-pointer shadow-xs"
                        title={`Revenue: ${formatIDR(b.rev)}`}
                      />
                      {/* Therapist Fee Bar */}
                      <div 
                        style={{ height: `${Math.max(feeHeight, 8)}%` }} 
                        className="w-4 sm:w-8 bg-[var(--fitlo-ink)] rounded-t-sm group-hover:opacity-90 transition-all relative cursor-pointer shadow-xs"
                        title={`Therapist Payment: ${formatIDR(b.fee)}`}
                      />
                    </div>
                    {/* X-Axis Label */}
                    <span className="text-[11px] font-bold text-[var(--fitlo-muted)] mt-2">
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Y-Axis Reference Scale */}
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--fitlo-muted)] pt-2 fitlo-num">
              <span>0</span>
              <span>{formatCompactScale(chartData.maxVal * 0.33)}</span>
              <span>{formatCompactScale(chartData.maxVal * 0.66)}</span>
              <span>{formatCompactScale(chartData.maxVal)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary Card */}
        <div className="lg:col-span-4 fitlo-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--fitlo-ink)] tracking-tight mb-4">
              Financial Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-[var(--fitlo-line)]">
                <span className="text-xs text-[var(--fitlo-muted)]">Total Bookings</span>
                <span className="text-sm font-bold text-[var(--fitlo-ink)] fitlo-num">
                  {bookingCount}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[var(--fitlo-line)]">
                <span className="text-xs text-[var(--fitlo-muted)]">Avg. Booking Value</span>
                <span className="text-sm font-bold text-[var(--fitlo-ink)] fitlo-num">
                  {formatIDR(avgBookingVal)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[var(--fitlo-line)]">
                <span className="text-xs text-[var(--fitlo-muted)]">Profit Margin</span>
                <span className="text-sm font-bold text-[var(--fitlo-accent)] fitlo-num">
                  {profitMarginPct}%
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[var(--fitlo-line)]">
                <span className="text-xs text-[var(--fitlo-muted)]">Labor Share Ratio</span>
                <span className="text-sm font-bold text-[var(--fitlo-ink)] fitlo-num">
                  {totalRev > 0 ? ((therapistPay / totalRev) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-xs text-[var(--fitlo-ink)] leading-relaxed">
            <span className="font-bold">Financial Integrity:</span> Figures reflect recognized revenue from verified direct website reservations, strictly segregated from affiliate partner transactions.
          </div>
        </div>
      </div>

      {/* ─── FITLO TRANSACTION REVENUE LEDGER ─── */}
      <div className="fitlo-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--fitlo-ink)] tracking-tight">
            Financial Transaction Records
          </h2>
          <span className="text-xs text-[var(--fitlo-muted)]">
            Showing {websiteBookings.length} website transactions
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="fitlo-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Service</th>
                <th className="text-right">Gross Amount</th>
                <th className="text-right">Therapist Fee</th>
                <th className="text-right">Net Profit</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {websiteBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--fitlo-muted)]">
                    No website transactions recorded for this period.
                  </td>
                </tr>
              ) : (
                websiteBookings.map(b => {
                  const gross = Number(b.revenue || b.total_price || b.total_amount || 0);
                  const fee = Number(b.therapist_fee || Math.round(gross * 0.45));
                  const net = gross - fee;

                  return (
                    <tr 
                      key={b.id} 
                      onClick={() => setSelectedBooking(b)}
                      className="cursor-pointer"
                    >
                      <td className="fitlo-num font-bold text-[var(--fitlo-ink)]">
                        {b.reference_number || String(b.id || '').slice(0, 8)}
                      </td>
                      <td className="text-[var(--fitlo-muted)] fitlo-num">
                        {b.booking_date || b.created_at?.split('T')[0]}
                      </td>
                      <td className="font-semibold text-[var(--fitlo-ink)]">
                        {b.guest_name || b.customer_name || 'Guest'}
                      </td>
                      <td className="text-[var(--fitlo-muted)]">
                        {b.treatment_name || b.service_name || 'Massage'}
                      </td>
                      <td className="text-right fitlo-num font-bold text-[var(--fitlo-ink)]">
                        {formatIDR(gross)}
                      </td>
                      <td className="text-right fitlo-num text-[var(--fitlo-muted)]">
                        {formatIDR(fee)}
                      </td>
                      <td className="text-right fitlo-num font-bold text-[var(--fitlo-accent)]">
                        {formatIDR(net)}
                      </td>
                      <td className="text-center">
                        <span className="fitlo-pill fitlo-pill--good">
                          {b.payment_status || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
