'use client';

import React, { useState } from 'react';
import { 
  Receipt, Wallet, ArrowUpRight, CheckCircle2, AlertCircle, 
  Clock, ShieldAlert, ChevronRight, DollarSign, Download, Filter 
} from 'lucide-react';
import { useTherapickAdmin, AffiliatePartner, CommissionLedgerItem } from '@/context/TherapickAdminContext';

export default function TherapickCommissionView() {
  const { 
    partners, 
    commissions, 
    affiliateMetrics, 
    setSelectedPartner, 
    setIsCreatePayoutOpen,
    updateCommissionStatus
  } = useTherapickAdmin();

  const [activeTab, setActiveTab] = useState<'summary' | 'ledger'>('summary');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<string>('all');

  const filteredLedger = commissions.filter(c => {
    if (ledgerStatusFilter !== 'all' && c.status !== ledgerStatusFilter) return false;
    return true;
  });

  const handleExportCSV = () => {
    if (activeTab === 'summary') {
      const headers = ['Partner', 'Code', 'Affiliate Revenue', 'Therapist Fees', 'Commission Earned', 'Commission Paid', 'Available Balance'];
      const rows = partners.map(p => {
        const fees = Math.round(p.affiliate_revenue * 0.45);
        return [
          `"${p.name}"`,
          p.referral_code,
          p.affiliate_revenue,
          fees,
          p.commission_earned,
          p.paid_amount || 0,
          p.available_balance || 0
        ];
      });
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `therapick_commission_summary_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = ['Transaction ID', 'Date', 'Partner', 'Booking ID', 'Amount', 'Rate', 'Status'];
      const rows = filteredLedger.map(c => [
        c.id,
        c.created_at,
        `"${c.partner_name}"`,
        c.booking_id,
        c.commission_amount,
        `${c.commission_rate}%`,
        c.status
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `therapick_commission_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Fitlo Page Header */}
      <div className="fitlo-page-head">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="fitlo-page-title">
              Commission Management
            </h1>
            <span className="fitlo-badge">
              <Receipt size={12} className="text-[#0b7a73]" />
              <span>Affiliate Finance</span>
            </span>
          </div>
          <p className="fitlo-page-subtitle">
            Audit partner commission earnings, payable balances, and immutable transaction ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--ghost"
          >
            <Download size={14} className="text-[var(--fitlo-muted)]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreatePayoutOpen(true)}
            className="fitlo-btn fitlo-btn--primary"
          >
            <Wallet size={15} />
            <span>Record Payout</span>
          </button>
        </div>
      </div>

      {/* Fitlo 4 Pastel Tinted KPI Tiles */}
      <div className="fitlo-kpis">
        <div className="fitlo-kpi fitlo-kpi--1">
          <div className="fitlo-kpi__label">
            <Receipt size={14} />
            <span>Affiliate Revenue</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            Rp {affiliateMetrics.revenue.toLocaleString('id-ID')}
          </div>
          <div className="fitlo-kpi__foot">
            <span>From completed referrals</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--2">
          <div className="fitlo-kpi__label">
            <DollarSign size={14} />
            <span>Therapist Fees</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            Rp {affiliateMetrics.therapist_fee.toLocaleString('id-ID')}
          </div>
          <div className="fitlo-kpi__foot">
            <span>Direct therapist payout costs</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--3">
          <div className="fitlo-kpi__label">
            <ArrowUpRight size={14} />
            <span>Commissions (15%)</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            Rp {affiliateMetrics.commission.toLocaleString('id-ID')}
          </div>
          <div className="fitlo-kpi__foot">
            <span>Earned by partners to date</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--4">
          <div className="fitlo-kpi__label">
            <Wallet size={14} />
            <span>Payable Balance</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            Rp {affiliateMetrics.available_balance.toLocaleString('id-ID')}
          </div>
          <div className="fitlo-kpi__foot">
            <span>Ready for bank disbursement</span>
          </div>
        </div>
      </div>

      {/* Regulatory Rule Banner */}
      <div className="fitlo-card !p-4 flex items-start gap-3 bg-[var(--fitlo-card-2)]">
        <ShieldAlert size={18} className="text-[var(--fitlo-muted)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--fitlo-muted)] space-y-1">
          <p className="font-bold text-[var(--fitlo-ink)]">Financial Integrity Rules</p>
          <p className="leading-relaxed">
            Commissions are credited strictly at 15% of the completed treatment value. Cancelled or refunded reservations automatically reverse commissions. Historical ledger records cannot be edited or silently removed.
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Partner Summary vs Transaction Ledger */}
      <div className="fitlo-sides !p-1 inline-flex">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`!h-9 !px-4 text-xs ${
            activeTab === 'summary' ? 'is-active !font-bold' : ''
          }`}
        >
          Partner Financial Breakdown
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`!h-9 !px-4 text-xs ${
            activeTab === 'ledger' ? 'is-active !font-bold' : ''
          }`}
        >
          Transaction Ledger ({commissions.length})
        </button>
      </div>

      {/* TAB 1: PARTNER FINANCIAL BREAKDOWN */}
      {activeTab === 'summary' && (
        <div className="fitlo-card fitlo-card--flush">
          <div className="fitlo-table-wrap">
            <table className="fitlo-table min-w-[950px]">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Referral Code</th>
                  <th>Affiliate Revenue</th>
                  <th>Est. Therapist Fees</th>
                  <th>Commission Earned</th>
                  <th>Commission Paid</th>
                  <th>Available Balance</th>
                  <th>Status</th>
                  <th className="r">Action</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => {
                  const estTherapistFee = Math.round(p.affiliate_revenue * 0.45);
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedPartner(p)}
                      className="cursor-pointer group"
                    >
                      <td>
                        <div className="font-bold text-[var(--fitlo-ink)]">{p.name}</div>
                        <div className="text-[11px] text-[var(--fitlo-muted)]">{p.business_name || 'Individual'}</div>
                      </td>

                      <td className="font-mono font-bold text-[var(--fitlo-ink-2)]">
                        {p.referral_code}
                      </td>

                      <td className="fitlo-num font-bold text-[var(--fitlo-ink)]">
                        Rp {(Number(p.affiliate_revenue) || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="fitlo-num text-[var(--fitlo-muted)]">
                        Rp {estTherapistFee.toLocaleString('id-ID')}
                      </td>

                      <td className="fitlo-num font-bold text-[var(--fitlo-accent-text)]">
                        Rp {(Number(p.commission_earned) || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="fitlo-num text-[var(--fitlo-muted)]">
                        Rp {(p.paid_amount || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="fitlo-num font-bold text-[var(--fitlo-good)]">
                        Rp {(p.available_balance || 0).toLocaleString('id-ID')}
                      </td>

                      <td>
                        <span className={`fitlo-pill ${p.status === 'active' ? 'fitlo-pill--good' : 'fitlo-pill--warn'}`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="r" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedPartner(p)}
                          className="fitlo-btn fitlo-btn--ghost !h-7 !px-2.5 !text-xs"
                        >
                          Inspect Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="fitlo-sides !p-1">
              {(['all', 'available', 'paid', 'pending', 'reversed'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setLedgerStatusFilter(status)}
                  className={`!h-8 !px-3 text-xs capitalize ${
                    ledgerStatusFilter === status ? 'is-active !font-bold' : ''
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--fitlo-muted)] fitlo-num">{filteredLedger.length} transaction entries</span>
          </div>

          <div className="fitlo-card fitlo-card--flush">
            <div className="fitlo-table-wrap">
              <table className="fitlo-table min-w-[850px]">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Partner</th>
                    <th>Booking Ref</th>
                    <th>Commission Amount</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th className="r">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[var(--fitlo-muted)]">
                        No commission entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono font-bold text-[var(--fitlo-ink)]">{String(c.id || '').slice(0, 10)}...</td>
                        <td className="text-[var(--fitlo-muted)]">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="font-bold text-[var(--fitlo-ink)]">{c.partner_name}</td>
                        <td className="font-mono text-[var(--fitlo-muted)]">{String(c.booking_id || '').slice(0, 8)}...</td>
                        <td className="font-bold fitlo-num text-[var(--fitlo-ink)]">
                          Rp {c.commission_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="font-mono text-[var(--fitlo-muted)]">{c.commission_rate}%</td>
                        <td>
                          <span className={`fitlo-pill ${
                            c.status === 'paid' ? 'fitlo-pill--info' :
                            c.status === 'approved' || c.status === 'available' ? 'fitlo-pill--good' :
                            c.status === 'pending' ? 'fitlo-pill--warn' : 'fitlo-pill--bad'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="r">
                          {c.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Approve commission for booking #${c.booking_id}? This makes it eligible for payouts.`)) {
                                  await updateCommissionStatus(c.id, 'approved');
                                }
                              }}
                              className="fitlo-btn fitlo-btn--primary !h-7 !px-2.5 !text-xs"
                            >
                              Approve
                            </button>
                          ) : c.status === 'approved' || c.status === 'available' ? (
                            <span className="text-[11px] font-semibold text-[var(--fitlo-good)]">Eligible</span>
                          ) : c.status === 'paid' ? (
                            <span className="text-[11px] font-semibold text-[var(--fitlo-info)]">Settled</span>
                          ) : (
                            <span className="text-[11px] text-[var(--fitlo-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
