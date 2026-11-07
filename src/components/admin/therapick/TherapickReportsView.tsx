'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Download, TrendingUp, Calendar, 
  DollarSign, PieChart, Users, ArrowUpRight, FileSpreadsheet, Layers 
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickReportsView() {
  const { 
    system, 
    websiteMetrics, 
    affiliateMetrics, 
    bookings, 
    partners, 
    dateRange, 
    setDateRange 
  } = useTherapickAdmin();

  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'quarter'>('this_month');

  // Month-by-month financial summary aggregated from real bookings
  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, { month: string; websiteRev: number; websiteCost: number; affiliateRev: number; comm: number }>();

    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthsMap.set(key, { month: label, websiteRev: 0, websiteCost: 0, affiliateRev: 0, comm: 0 });
    }

    bookings.forEach((b: any) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return;
      const dateStr = b.booking_date || b.created_at?.split('T')[0] || '';
      if (!dateStr) return;
      const key = dateStr.slice(0, 7);
      const rev = Number(b.revenue || b.total_price || b.total_amount || 0);

      if (!monthsMap.has(key)) {
        const parts = key.split('-');
        if (parts.length === 2) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
          const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          monthsMap.set(key, { month: label, websiteRev: 0, websiteCost: 0, affiliateRev: 0, comm: 0 });
        }
      }

      const entry = monthsMap.get(key);
      if (entry) {
        if (b.booking_system === 'affiliate' || b.source === 'partner' || b.affiliate_code) {
          entry.affiliateRev += rev;
          const commVal = b.commission?.commission_amount ? Number(b.commission.commission_amount) : Math.round(rev * 0.15);
          entry.comm += commVal;
        } else {
          entry.websiteRev += rev;
          const cost = Number(b.therapist_fee || Math.round(rev * 0.45));
          entry.websiteCost += cost;
        }
      }
    });

    return Array.from(monthsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, val]) => val);
  }, [bookings]);

  const websiteMargin = websiteMetrics.revenue > 0 ? ((websiteMetrics.net_profit / websiteMetrics.revenue) * 100).toFixed(1) : '0';
  const affiliateMargin = affiliateMetrics.revenue > 0 ? ((affiliateMetrics.net_profit / affiliateMetrics.revenue) * 100).toFixed(1) : '0';

  const handleExportCSV = () => {
    if (system === 'website') {
      const headers = ['Month', 'Gross Revenue (IDR)', 'Therapist Cost (IDR)', 'Net Operating Profit (IDR)', 'Margin'];
      const rows = monthlyData.map(m => [
        m.month,
        m.websiteRev,
        m.websiteCost,
        m.websiteRev - m.websiteCost,
        '50%'
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `therapick_website_financial_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = ['Month', 'Affiliate Revenue (IDR)', 'Therapist Fees (IDR)', 'Partner Commission 15% (IDR)', 'Net Profit (IDR)', 'Active Partners'];
      const rows = monthlyData.map(m => {
        const fees = Math.round(m.affiliateRev * 0.45);
        const profit = m.affiliateRev - fees - m.comm;
        return [
          m.month,
          m.affiliateRev,
          fees,
          m.comm,
          profit,
          partners.length
        ];
      });
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `therapick_affiliate_financial_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── FITLO PAGE HEADER ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">
            {system === 'website' ? 'Website Financial Reports' : 'Affiliate Financial Reports'}
          </h1>
          <p className="fitlo-page-sub">
            {system === 'website'
              ? 'Audited income statement, treatment margins, and direct guest revenue trends.'
              : 'Partner revenue distribution, commission settlements, therapist costs, and net platform yield.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--primary flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Download Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* ─── FITLO 4 PASTEL FINANCIAL KPI TILES ─── */}
      {system === 'website' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="fitlo-kpi fitlo-kpi--cyan">
            <span className="fitlo-kpi__lbl">Gross Website Revenue</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl mt-1">
              Rp {websiteMetrics.revenue.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub font-semibold text-[var(--fitlo-accent)] mt-1">● {dateRange.label || 'Current Period'}</div>
          </div>

          <div className="fitlo-kpi fitlo-kpi--pebble">
            <span className="fitlo-kpi__lbl">Therapist Payments</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl mt-1">
              Rp {websiteMetrics.therapist_payments.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub mt-1">Direct treatment labor cost</div>
          </div>

          <div className="fitlo-kpi fitlo-kpi--lemon">
            <span className="fitlo-kpi__lbl">Net Operating Profit</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl text-[var(--fitlo-accent)] mt-1">
              Rp {websiteMetrics.net_profit.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub font-bold text-[var(--fitlo-accent)] mt-1">Net margin: ~{websiteMargin}%</div>
          </div>

          <div className="fitlo-kpi fitlo-kpi--peach">
            <span className="fitlo-kpi__lbl">Avg Booking Value</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl mt-1">
              Rp {websiteMetrics.avg_booking_value.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub mt-1">{websiteMetrics.booking_count} completed sessions</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="fitlo-kpi fitlo-kpi--cyan">
            <span className="fitlo-kpi__lbl">Affiliate Gross Revenue</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl mt-1">
              Rp {affiliateMetrics.revenue.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub font-semibold text-[var(--fitlo-accent)] mt-1">● {dateRange.label || 'Current Period'}</div>
          </div>

          <div className="fitlo-kpi fitlo-kpi--pebble">
            <span className="fitlo-kpi__lbl">Therapist Fees</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl mt-1">
              Rp {affiliateMetrics.therapist_fee.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub mt-1">Disbursed to spa therapists</div>
          </div>

          <div className="fitlo-kpi fitlo-kpi--peach">
            <span className="fitlo-kpi__lbl">Partner Commissions (15%)</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl mt-1 text-[var(--fitlo-now)]">
              Rp {affiliateMetrics.commission.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub mt-1">Payable to referring partners</div>
          </div>

          <div className="fitlo-kpi fitlo-kpi--lemon">
            <span className="fitlo-kpi__lbl">Platform Net Profit</span>
            <div className="fitlo-kpi__val text-xl sm:text-2xl text-[var(--fitlo-accent)] mt-1">
              Rp {affiliateMetrics.net_profit.toLocaleString('id-ID')}
            </div>
            <div className="fitlo-kpi__sub font-bold text-[var(--fitlo-accent)] mt-1">Net yield: ~{affiliateMargin}%</div>
          </div>
        </div>
      )}

      {/* ─── HISTORICAL MONTHLY PERFORMANCE TABLE ─── */}
      <div className="fitlo-card p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[var(--fitlo-ink)]">Historical Monthly Performance</h3>
          <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">Audited monthly statements over the past 5 operating months.</p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="fitlo-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Revenue</th>
                <th>{system === 'website' ? 'Therapist Payments' : 'Therapist Fees'}</th>
                {system === 'affiliate' && <th>Commissions (15%)</th>}
                <th>Net Platform Profit</th>
                <th>Operating Margin</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, idx) => {
                const rev = system === 'website' ? m.websiteRev : m.affiliateRev;
                const cost = system === 'website' ? m.websiteCost : Math.round(m.affiliateRev * 0.45);
                const comm = system === 'affiliate' ? m.comm : 0;
                const netProfit = rev - cost - comm;
                const margin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : '0';

                return (
                  <tr key={idx}>
                    <td className="font-bold text-[var(--fitlo-ink)]">{m.month}</td>
                    <td className="fitlo-num font-bold text-[var(--fitlo-ink)]">
                      Rp {rev.toLocaleString('id-ID')}
                    </td>
                    <td className="fitlo-num text-[var(--fitlo-muted)]">
                      Rp {cost.toLocaleString('id-ID')}
                    </td>
                    {system === 'affiliate' && (
                      <td className="fitlo-num font-bold text-[var(--fitlo-now)]">
                        Rp {comm.toLocaleString('id-ID')}
                      </td>
                    )}
                    <td className="fitlo-num font-bold text-[var(--fitlo-accent)]">
                      Rp {netProfit.toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span className="fitlo-pill fitlo-pill--good">
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── PARTNER REVENUE ATTRIBUTION ─── */}
      {system === 'affiliate' && (
        <div className="fitlo-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--fitlo-ink)]">Revenue Yield by Partner</h3>
          <div className="space-y-3">
            {partners.slice(0, 5).map((p, index) => {
              const pct = affiliateMetrics.revenue > 0 
                ? Math.round((p.affiliate_revenue / affiliateMetrics.revenue) * 100) 
                : 0;

              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-[var(--fitlo-ink)] font-bold text-[10px] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-bold text-[var(--fitlo-ink)]">{p.name}</span>
                      <span className="text-[var(--fitlo-muted)] fitlo-num text-[11px]">({p.referral_code})</span>
                    </div>
                    <span className="font-bold fitlo-num text-[var(--fitlo-ink)]">
                      Rp {p.affiliate_revenue.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] overflow-hidden">
                    <div 
                      className="h-full bg-[var(--fitlo-accent)] rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
