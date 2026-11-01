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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {system === 'website' ? 'Website Financial Report' : 'Affiliate Financial Report'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {system === 'website'
              ? 'Audited income statement, treatment margins, and direct guest revenue trends.'
              : 'Partner revenue distribution, commission settlements, therapist costs, and net platform yield.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Download Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Summary Cards */}
      {system === 'website' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Gross Website Revenue</span>
            <div className="text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
              Rp {websiteMetrics.revenue.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">▲ +14% vs previous period</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Therapist Payments</span>
            <div className="text-2xl font-extrabold text-stone-700 mt-1 font-mono">
              Rp {websiteMetrics.therapist_payments.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-stone-400 mt-1">Direct treatment labor cost</div>
          </div>

          <div className="bg-[#fef9c3]/70 p-5 rounded-2xl border border-[#fef08a] shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">Net Operating Profit</span>
            <div className="text-2xl font-extrabold text-amber-950 mt-1 font-mono">
              Rp {websiteMetrics.net_profit.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-amber-800 mt-1 font-semibold">Net margin: ~50.2%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Avg Booking Value</span>
            <div className="text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
              Rp {websiteMetrics.avg_booking_value.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-stone-400 mt-1">{websiteMetrics.booking_count} completed sessions</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Affiliate Gross Revenue</span>
            <div className="text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
              Rp {affiliateMetrics.revenue.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">▲ +12% vs previous period</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Therapist Fees</span>
            <div className="text-2xl font-extrabold text-stone-700 mt-1 font-mono">
              Rp {affiliateMetrics.therapist_fee.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-stone-400 mt-1">Disbursed to spa therapists</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700">Partner Commissions (15%)</span>
            <div className="text-2xl font-extrabold text-amber-800 mt-1 font-mono">
              Rp {affiliateMetrics.commission.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-stone-400 mt-1">Payable to referring partners</div>
          </div>

          <div className="bg-[#fef9c3]/70 p-5 rounded-2xl border border-[#fef08a] shadow-2xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">Platform Net Profit</span>
            <div className="text-2xl font-extrabold text-amber-950 mt-1 font-mono">
              Rp {affiliateMetrics.net_profit.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-amber-800 mt-1 font-semibold">Yield after fees & commission</div>
          </div>
        </div>
      )}

      {/* Monthly Financial Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Historical Monthly Performance</h3>
            <p className="text-xs text-stone-500">Audited monthly statements over the past 5 operating months.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">{system === 'website' ? 'Therapist Payments' : 'Therapist Fees'}</th>
                {system === 'affiliate' && <th className="py-3 px-4">Commissions (15%)</th>}
                <th className="py-3 px-4">Net Platform Profit</th>
                <th className="py-3 px-4">Operating Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {monthlyData.map((m, idx) => {
                const rev = system === 'website' ? m.websiteRev : m.affiliateRev;
                const cost = system === 'website' ? m.websiteCost : Math.round(m.affiliateRev * 0.45);
                const comm = system === 'affiliate' ? m.comm : 0;
                const netProfit = rev - cost - comm;
                const margin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : '0';

                return (
                  <tr key={idx} className="hover:bg-amber-50/20">
                    <td className="py-3.5 px-4 font-bold text-neutral-900">{m.month}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      Rp {rev.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      Rp {cost.toLocaleString('id-ID')}
                    </td>
                    {system === 'affiliate' && (
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        Rp {comm.toLocaleString('id-ID')}
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-800">
                      Rp {netProfit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 font-mono">
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

      {/* Partner Attribution Breakdown (If on Affiliate System) */}
      {system === 'affiliate' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-neutral-900">Revenue Yield by Partner</h3>
          <div className="space-y-3">
            {partners.slice(0, 5).map((p, index) => {
              const pct = affiliateMetrics.revenue > 0 
                ? Math.round((p.affiliate_revenue / affiliateMetrics.revenue) * 100) 
                : 0;

              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-neutral-800 font-bold text-[10px] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-bold text-neutral-900">{p.name}</span>
                      <span className="text-stone-400 font-mono text-[11px]">({p.referral_code})</span>
                    </div>
                    <span className="font-bold font-mono text-neutral-900">
                      Rp {p.affiliate_revenue.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div 
                      className="h-full bg-[#facc15] rounded-full transition-all duration-500" 
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
