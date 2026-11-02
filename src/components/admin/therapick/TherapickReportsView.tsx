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

  // Month-by-month financial summary
  const monthlyData = [
    { month: 'Jun 2026', websiteRev: 42000000, websiteCost: 21000000, affiliateRev: 18500000, comm: 2775000 },
    { month: 'Jul 2026', websiteRev: 49500000, websiteCost: 24750000, affiliateRev: 22100000, comm: 3315000 },
    { month: 'Aug 2026', websiteRev: 54000000, websiteCost: 27000000, affiliateRev: 25400000, comm: 3810000 },
    { month: 'Sep 2026', websiteRev: 48000000, websiteCost: 24000000, affiliateRev: 26800000, comm: 4020000 },
    { month: 'Oct 2026', websiteRev: websiteMetrics.revenue, websiteCost: websiteMetrics.therapist_payments, affiliateRev: affiliateMetrics.revenue, comm: affiliateMetrics.commission },
  ];

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
            <div className="fitlo-kpi__sub font-semibold text-[var(--fitlo-accent)] mt-1">▲ +14% vs previous period</div>
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
            <div className="fitlo-kpi__sub font-bold text-[var(--fitlo-accent)] mt-1">Net margin: ~50.2%</div>
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
            <div className="fitlo-kpi__sub font-semibold text-[var(--fitlo-accent)] mt-1">▲ +12% vs previous period</div>
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
            <div className="fitlo-kpi__sub font-bold text-[var(--fitlo-accent)] mt-1">Yield after fees & commission</div>
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
