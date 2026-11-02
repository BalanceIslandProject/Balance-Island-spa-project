'use client';

import React, { useState, useMemo } from 'react';
import { 
  Wallet, Search, Filter, CheckCircle2, AlertCircle, 
  Download, ArrowUpRight, Check, X, RefreshCw, 
  CreditCard, Banknote, RotateCcw, Calendar
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

export default function TherapickPaymentsView() {
  const { 
    websiteBookings, 
    updatePaymentStatus, 
    setSelectedBooking,
    refreshData,
    loading 
  } = useTherapickAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'refunded'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual payment modal state
  const [manualPayModal, setManualPayModal] = useState<{ isOpen: boolean; booking: any | null; method: string }>({
    isOpen: false,
    booking: null,
    method: 'Cash'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics summary
  const metrics = useMemo(() => {
    let totalGross = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;

    websiteBookings.forEach(b => {
      const amount = Number(b.revenue || b.total_amount || 375000);
      totalGross += amount;

      const isPaid = b.payment_status === 'Paid';
      if (isPaid) {
        totalPaid += amount;
        paidCount++;
      } else {
        totalUnpaid += amount;
      }
    });

    const paidRatePct = websiteBookings.length > 0 
      ? Math.round((paidCount / websiteBookings.length) * 100) 
      : 100;

    return { totalGross, totalPaid, totalUnpaid, paidRatePct };
  }, [websiteBookings]);

  // Filtered payments list
  const filteredBookings = useMemo(() => {
    return websiteBookings.filter(b => {
      const idMatch = (b.reference_number || b.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const nameMatch = (b.guest_name || b.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!idMatch && !nameMatch) return false;

      if (statusFilter !== 'all') {
        const curStatus = (b.payment_status || 'Unpaid').toLowerCase();
        if (curStatus !== statusFilter.toLowerCase()) return false;
      }

      if (methodFilter !== 'all') {
        const curMethod = (b.payment_method || 'Online').toLowerCase();
        if (curMethod !== methodFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [websiteBookings, searchQuery, statusFilter, methodFilter]);

  // Handle Mark as Paid
  const handleConfirmPayment = async (booking: any, method: string) => {
    await updatePaymentStatus(booking.id, 'Paid', method);
    showToast(`Payment confirmed for Booking #${booking.reference_number || String(booking.id || '').slice(0, 8)}`);
    setManualPayModal({ isOpen: false, booking: null, method: 'Cash' });
  };

  // Handle Refund
  const handleIssueRefund = async (booking: any) => {
    if (!confirm(`Are you sure you want to issue a refund for Booking #${booking.reference_number || String(booking.id || '').slice(0, 8)}?`)) return;
    await updatePaymentStatus(booking.id, 'Refunded');
    showToast(`Refund issued for Booking #${booking.reference_number || String(booking.id || '').slice(0, 8)}`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Total Amount', 'Amount Paid', 'Remaining Balance', 'Method', 'Payment Status', 'Date'];
    const rows = filteredBookings.map(b => {
      const total = Number(b.revenue || b.total_amount || 375000);
      const isPaid = b.payment_status === 'Paid';
      return [
        b.reference_number || b.id,
        b.guest_name || b.customer_name || 'Guest',
        total,
        isPaid ? total : 0,
        isPaid ? 0 : total,
        b.payment_method || 'Online',
        b.payment_status || 'Unpaid',
        b.booking_date || b.created_at?.split('T')[0] || ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `therapick_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[var(--fitlo-line)] flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-[var(--fitlo-accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FITLO PAGE HEADER ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">Payment Settlements</h1>
          <p className="fitlo-page-sub">
            Transaction reconciliation, manual on-arrival collections, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={loading}
            className="fitlo-btn fitlo-btn--ghost flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[var(--fitlo-accent)]' : 'text-[var(--fitlo-muted)]'} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--ghost flex items-center gap-2"
          >
            <Download size={14} className="text-[var(--fitlo-muted)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── FITLO 4 PASTEL KPI TILES ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="fitlo-kpi fitlo-kpi--peach">
          <div className="flex items-center justify-between mb-1">
            <span className="fitlo-kpi__lbl">Total Booking Value</span>
            <Wallet size={15} className="text-[var(--fitlo-ink)] opacity-60" />
          </div>
          <div className="fitlo-kpi__val text-xl sm:text-2xl">
            {formatIDR(metrics.totalGross)}
          </div>
          <div className="fitlo-kpi__sub">Across all website reservations</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--cyan">
          <div className="flex items-center justify-between mb-1">
            <span className="fitlo-kpi__lbl">Collected Revenue</span>
            <CheckCircle2 size={15} className="text-[var(--fitlo-accent)]" />
          </div>
          <div className="fitlo-kpi__val text-xl sm:text-2xl text-[var(--fitlo-accent)]">
            {formatIDR(metrics.totalPaid)}
          </div>
          <div className="fitlo-kpi__sub">Verified settled payments</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--lemon">
          <div className="flex items-center justify-between mb-1">
            <span className="fitlo-kpi__lbl">Outstanding Balance</span>
            <AlertCircle size={15} className="text-[var(--fitlo-now)]" />
          </div>
          <div className="fitlo-kpi__val text-xl sm:text-2xl text-[var(--fitlo-now)]">
            {formatIDR(metrics.totalUnpaid)}
          </div>
          <div className="fitlo-kpi__sub">Cash on arrival / pending</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--pebble">
          <div className="flex items-center justify-between mb-1">
            <span className="fitlo-kpi__lbl">Settlement Rate</span>
            <CreditCard size={15} className="text-[var(--fitlo-ink)] opacity-60" />
          </div>
          <div className="fitlo-kpi__val text-xl sm:text-2xl">
            {metrics.paidRatePct}%
          </div>
          <div className="fitlo-kpi__sub">Completed payment share</div>
        </div>
      </div>

      {/* ─── FITLO FILTER AND SEARCH BAR ─── */}
      <div className="fitlo-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fitlo-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by booking ID or customer name..."
            className="fitlo-input w-full pl-9"
          />
        </div>

        {/* Status Segmented Tabs */}
        <div className="fitlo-sides">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`fitlo-sides__btn ${statusFilter === 'all' ? 'is-active' : ''}`}
          >
            All Status
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`fitlo-sides__btn ${statusFilter === 'paid' ? 'is-active' : ''}`}
          >
            Paid
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unpaid')}
            className={`fitlo-sides__btn ${statusFilter === 'unpaid' ? 'is-active' : ''}`}
          >
            Unpaid
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('refunded')}
            className={`fitlo-sides__btn ${statusFilter === 'refunded' ? 'is-active' : ''}`}
          >
            Refunded
          </button>
        </div>
      </div>

      {/* ─── MAIN PAYMENTS TABLE ─── */}
      <div className="fitlo-card p-0 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="fitlo-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Remaining Balance</th>
                <th>Method</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--fitlo-muted)]">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const total = Number(b.revenue || b.total_amount || 375000);
                  const isPaid = b.payment_status === 'Paid';
                  const isRefunded = b.payment_status === 'Refunded';
                  const paidAmount = isPaid ? total : 0;
                  const remaining = isPaid ? 0 : total;

                  return (
                    <tr 
                      key={b.id} 
                      className="transition-colors"
                    >
                      <td className="fitlo-num font-bold text-[var(--fitlo-ink)]">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="hover:text-[var(--fitlo-accent)] transition-colors cursor-pointer text-left"
                        >
                          {b.reference_number || String(b.id || '').slice(0, 8)}
                        </button>
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--fitlo-ink)]">{b.guest_name || b.customer_name || 'Guest'}</div>
                        <div className="text-[11px] text-[var(--fitlo-muted)] fitlo-num">{b.booking_date || b.created_at?.split('T')[0]}</div>
                      </td>
                      <td className="fitlo-num font-bold text-[var(--fitlo-ink)]">
                        {formatIDR(total)}
                      </td>
                      <td className="fitlo-num font-semibold text-[var(--fitlo-accent)]">
                        {formatIDR(paidAmount)}
                      </td>
                      <td className="fitlo-num text-[var(--fitlo-muted)]">
                        {formatIDR(remaining)}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-[11px] font-semibold text-[var(--fitlo-ink)]">
                          {b.payment_method === 'Cash' ? <Banknote size={12} /> : <CreditCard size={12} />}
                          <span>{b.payment_method || 'Online'}</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`fitlo-pill ${
                          isPaid 
                            ? 'fitlo-pill--good' 
                            : isRefunded
                            ? 'fitlo-pill--bad'
                            : 'fitlo-pill--warn'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPaid ? 'bg-emerald-500' : isRefunded ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {b.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && !isRefunded && (
                            <button
                              type="button"
                              onClick={() => setManualPayModal({ isOpen: true, booking: b, method: 'Cash' })}
                              className="px-2.5 py-1 rounded-lg bg-[var(--fitlo-accent)] hover:bg-[#08625c] text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                            >
                              Record Paid
                            </button>
                          )}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => handleIssueRefund(b)}
                              title="Issue Refund"
                              className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-bad)] hover:bg-[var(--fitlo-bad-soft)] transition-colors cursor-pointer"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MANUAL PAYMENT MODAL ─── */}
      {manualPayModal.isOpen && manualPayModal.booking && (
        <div className="fitlo-modal-backdrop">
          <div className="fitlo-card w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--fitlo-ink)]">Record Manual Payment</h3>
              <button 
                type="button" 
                onClick={() => setManualPayModal({ isOpen: false, booking: null, method: 'Cash' })}
                className="text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] space-y-1 text-xs">
              <div className="text-[var(--fitlo-muted)]">Booking: <span className="fitlo-num font-bold text-[var(--fitlo-ink)]">#{manualPayModal.booking.reference_number || String(manualPayModal.booking.id || '').slice(0, 8)}</span></div>
              <div className="text-[var(--fitlo-muted)]">Guest: <span className="font-semibold text-[var(--fitlo-ink)]">{manualPayModal.booking.guest_name || manualPayModal.booking.customer_name}</span></div>
              <div className="text-[var(--fitlo-muted)]">Amount: <span className="fitlo-num font-bold text-[var(--fitlo-accent)]">{formatIDR(manualPayModal.booking.revenue || manualPayModal.booking.total_amount)}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--fitlo-ink)]">Payment Method</label>
              <select
                value={manualPayModal.method}
                onChange={e => setManualPayModal(prev => ({ ...prev, method: e.target.value }))}
                className="fitlo-input w-full"
              >
                <option value="Cash">Cash on Arrival (Villa)</option>
                <option value="Online">Online Bank Transfer / QRIS</option>
                <option value="EDC Machine">Credit Card (EDC Machine)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--fitlo-line)]">
              <button
                type="button"
                onClick={() => setManualPayModal({ isOpen: false, booking: null, method: 'Cash' })}
                className="fitlo-btn fitlo-btn--ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPayment(manualPayModal.booking, manualPayModal.method)}
                className="fitlo-btn fitlo-btn--primary"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
