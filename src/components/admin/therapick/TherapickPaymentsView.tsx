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
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-[#facc15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Payments
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage customer transaction records, manual collections, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-neutral-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-amber-600' : 'text-stone-500'} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-neutral-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Download size={14} className="text-stone-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Total Booking Value</span>
            <Wallet size={16} className="text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono">
            {formatIDR(metrics.totalGross)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Across all website reservations</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Collected Revenue</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
            {formatIDR(metrics.totalPaid)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Verified settled payments</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Outstanding Balance</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono">
            {formatIDR(metrics.totalUnpaid)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Cash on arrival / pending</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Settlement Rate</span>
            <CreditCard size={16} className="text-neutral-700" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono">
            {metrics.paidRatePct}%
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Completed payment share</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by booking ID or customer name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'paid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'unpaid' ? 'bg-white text-amber-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'refunded' ? 'bg-white text-rose-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Refunded
            </button>
          </div>
        </div>
      </div>

      {/* Main Payments Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-mono uppercase font-bold text-stone-400">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
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
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="hover:text-amber-700 transition-colors cursor-pointer text-left"
                        >
                          {b.reference_number || String(b.id || '').slice(0, 8)}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">{b.guest_name || b.customer_name || 'Guest'}</div>
                        <div className="text-[11px] text-stone-400">{b.booking_date || b.created_at?.split('T')[0]}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        {formatIDR(total)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                        {formatIDR(paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {formatIDR(remaining)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 font-mono text-[11px] font-semibold text-stone-700">
                          {b.payment_method === 'Cash' ? <Banknote size={12} /> : <CreditCard size={12} />}
                          <span>{b.payment_method || 'Online'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isRefunded
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPaid ? 'bg-emerald-500' : isRefunded ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {b.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && !isRefunded && (
                            <button
                              type="button"
                              onClick={() => setManualPayModal({ isOpen: true, booking: b, method: 'Cash' })}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Record Paid
                            </button>
                          )}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => handleIssueRefund(b)}
                              title="Issue Refund"
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="p-1 rounded-lg text-stone-400 hover:text-neutral-800 hover:bg-stone-100 transition-colors cursor-pointer"
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

      {/* Manual Payment Confirmation Modal */}
      {manualPayModal.isOpen && manualPayModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">Record Manual Payment</h3>
              <button 
                type="button" 
                onClick={() => setManualPayModal({ isOpen: false, booking: null, method: 'Cash' })}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
              <div className="text-stone-500">Booking: <span className="font-mono font-bold text-neutral-900">#{manualPayModal.booking.reference_number || String(manualPayModal.booking.id || '').slice(0, 8)}</span></div>
              <div className="text-stone-500">Guest: <span className="font-semibold text-neutral-900">{manualPayModal.booking.guest_name || manualPayModal.booking.customer_name}</span></div>
              <div className="text-stone-500">Amount: <span className="font-mono font-bold text-emerald-700">{formatIDR(manualPayModal.booking.revenue || manualPayModal.booking.total_amount)}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Payment Method</label>
              <select
                value={manualPayModal.method}
                onChange={e => setManualPayModal(prev => ({ ...prev, method: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="Cash">Cash on Arrival (Villa)</option>
                <option value="Online">Online Bank Transfer / QRIS</option>
                <option value="EDC Machine">Credit Card (EDC Machine)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualPayModal({ isOpen: false, booking: null, method: 'Cash' })}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPayment(manualPayModal.booking, manualPayModal.method)}
                className="px-4 py-1.5 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
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
