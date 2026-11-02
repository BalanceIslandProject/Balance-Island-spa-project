'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { 
  PayoutTab, 
  PartnerPayoutRow, 
  PaymentRecord, 
  PayoutWeeklyScheduleConfig 
} from '@/types/payouts';
import { 
  loadPayoutConfig, 
  savePayoutConfig, 
  calculateNextScheduledDate, 
  addDays,
  formatIDR, 
  formatWitaDate 
} from '@/lib/payoutScheduler';

import PayoutsTabNav from './payouts/PayoutsTabNav';
import PayoutsOverviewTab from './payouts/PayoutsOverviewTab';
import PaymentHistoryTab from './payouts/PaymentHistoryTab';
import CommissionCalendarTab from './payouts/CommissionCalendarTab';
import PayoutsSettingsTab from './payouts/PayoutsSettingsTab';
import RecordPaymentModal from './payouts/RecordPaymentModal';
import PayoutPartnerDrawer from './payouts/PayoutPartnerDrawer';

export default function TherapickPayoutsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { 
    partners, 
    payouts, 
    commissions, 
    bookings,
    createPayout, 
    refreshData 
  } = useTherapickAdmin();

  // Active sub-tab (4 sections only: overview, history, calendar, settings)
  const sectionParam = searchParams.get('section') as PayoutTab | null;
  const [activeTab, setActiveTab] = useState<PayoutTab>(() => {
    if (sectionParam && ['overview', 'history', 'calendar', 'settings'].includes(sectionParam)) {
      return sectionParam;
    }
    return 'overview';
  });

  const handleTabChange = useCallback((newTab: PayoutTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'payouts');
    params.set('section', newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Weekly Schedule Configuration (Strict 7-day recurring cycle)
  const [scheduleConfig, setScheduleConfig] = useState<PayoutWeeklyScheduleConfig>(() => loadPayoutConfig());

  // Interactive UI State
  const [selectedPartnerForRecord, setSelectedPartnerForRecord] = useState<PartnerPayoutRow | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPartnerForDrawer, setSelectedPartnerForDrawer] = useState<PartnerPayoutRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-dismiss notice
  const triggerNotice = useCallback((type: 'success' | 'info' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 5000);
  }, []);

  // Compute Next Scheduled 7-Day Cycle Date
  const currentNextScheduledDate = useMemo(() => {
    return calculateNextScheduledDate(scheduleConfig.first_payout_date);
  }, [scheduleConfig.first_payout_date]);

  // Transform live partner data into clean PartnerPayoutRows
  const partnerRows: PartnerPayoutRow[] = useMemo(() => {
    return partners.map(p => {
      const pComms = commissions.filter(c => 
        c.partner_id === p.id || 
        (c.partner_code && p.referral_code && c.partner_code.toUpperCase() === p.referral_code.toUpperCase()) ||
        (c.partner_name && p.name && c.partner_name.toLowerCase() === p.name.toLowerCase())
      );

      const pPayouts = payouts.filter(py => 
        py.partner_id === p.id ||
        (py.partner_name && p.name && py.partner_name.toLowerCase() === p.name.toLowerCase())
      );

      // STRICT PAYOUT ELIGIBILITY:
      // Only approved commissions that are NOT yet settled / paid are eligible for payout!
      // Pending commissions (treatment not done yet) MUST NOT be counted or displayed in unpaid!
      // Cancelled treatments/commissions CANNOT be processed.
      const eligibleComms = pComms.filter(c => {
        const status = String(c.status || '').toLowerCase();
        const isNotSettled = !c.payout_id && !c.is_settled && status !== 'paid';
        return status === 'approved' && isNotSettled;
      });

      const paid = pPayouts
        .filter(py => py.status === 'completed' || py.status === 'paid' || py.status === 'Processed')
        .reduce((sum, py) => sum + (Number(py.amount) || 0), 0);
      const unpaid = eligibleComms.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
      const earned = paid + unpaid;

      // 7-day cycle: if unpaid < minimum threshold (100k), rolls over to next cycle
      const isBelowThreshold = unpaid > 0 && unpaid < scheduleConfig.min_payout_threshold;
      const nextDate = isBelowThreshold 
        ? addDays(currentNextScheduledDate, 7) 
        : currentNextScheduledDate;

      const status: 'Unpaid' | 'Partially Paid' | 'Paid' = 
        unpaid === 0 && paid > 0 
          ? 'Paid' 
          : paid > 0 && unpaid > 0 
          ? 'Partially Paid' 
          : 'Unpaid';

      return {
        id: p.id,
        name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.business_name || 'Partner',
        business_name: p.business_name || 'Affiliate Partner',
        partner_code: p.partner_code || p.referral_code || 'PT-AFF',
        referral_code: p.referral_code || p.partner_code || '',
        bank_name: p.partner_bank || p.payout_details?.bank_name || 'BCA',
        account_number: p.partner_account || p.payout_details?.account_number || '',
        account_holder: p.partner_holder || p.payout_details?.account_holder || p.name,
        joined_date: p.created_at ? formatWitaDate(p.created_at) : '12 Sep 2026',
        earned,
        paid,
        unpaid,
        next_payout_date: nextDate,
        status,
        commission_count: pComms.length,
        payment_count: pPayouts.length
      };
    });
  }, [partners, commissions, payouts, currentNextScheduledDate, scheduleConfig.min_payout_threshold]);

  // Transform live payouts into auditable PaymentRecords
  const paymentRecords: PaymentRecord[] = useMemo(() => {
    return payouts.map((p, idx) => {
      const pIdStr = String(p.id || '');
      const cleanRef = p.reference || p.payout_reference || p.payment_reference || (pIdStr ? `TRX${pIdStr.slice(0, 6).toUpperCase()}` : 'TRX-PAY');
      const paymentCode = pIdStr.startsWith('PAY-') ? pIdStr : `PAY-${new Date(p.created_at || Date.now()).getFullYear()}-${String(idx + 1).padStart(4, '0')}`;
      return {
        id: paymentCode,
        date: p.created_at ? p.created_at.split('T')[0] : '2026-11-01',
        partner_id: p.partner_id,
        partner_name: p.partner_name || 'Partner',
        partner_business: p.partner_business || '',
        amount: Number(p.amount || 0),
        method: p.method || p.payout_method || 'Bank Transfer (BCA)',
        reference: cleanRef,
        status: 'Recorded' as const,
        notes: p.notes || '',
        receipt_url: p.proof_document_url || '',
        created_at: p.created_at || new Date().toISOString()
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payouts]);

  // Open Record Payment Modal for a partner
  const handleOpenRecordPayment = useCallback((partner: PartnerPayoutRow) => {
    setSelectedPartnerForRecord(partner);
    setIsRecordModalOpen(true);
  }, []);

  // Open Partner Details Drawer
  const handleSelectPartnerForDrawer = useCallback((partner: PartnerPayoutRow) => {
    setSelectedPartnerForDrawer(partner);
    setIsDrawerOpen(true);
  }, []);

  // Execute Record Payment (Core Business Action)
  const handleRecordPayment = useCallback(async (paymentData: {
    partner_id: string;
    amount: number;
    payment_date: string;
    method: string;
    reference: string;
    notes: string;
    receipt_url?: string;
    commission_ids?: string[];
  }) => {
    try {
      const res = await createPayout({
        partner_id: paymentData.partner_id,
        amount: paymentData.amount,
        reference: paymentData.reference,
        notes: paymentData.notes,
        date: paymentData.payment_date,
        method: paymentData.method,
        receipt_url: paymentData.receipt_url,
        commission_ids: paymentData.commission_ids,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record payment');
      }

      await refreshData();

      const pObj = partnerRows.find(p => p.id === paymentData.partner_id);
      const pName = pObj?.name || 'Partner';

      triggerNotice(
        'success',
        `Payment recorded: ${formatIDR(paymentData.amount)} to ${pName} on ${formatWitaDate(paymentData.payment_date)}.`
      );

      return { success: true };
    } catch (err: any) {
      triggerNotice('error', err.message || 'Failed to record manual disbursement.');
      return { success: false, error: err.message };
    }
  }, [createPayout, refreshData, partnerRows, triggerNotice]);

  // Save Settings
  const handleSaveConfig = useCallback(async (updated: PayoutWeeklyScheduleConfig) => {
    savePayoutConfig(updated);
    setScheduleConfig(updated);
    triggerNotice('success', 'Payout settings saved successfully with fixed 7-day recurring schedule.');
  }, [triggerNotice]);

  // Refresh Data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      triggerNotice('success', 'Financial balances synchronized with database.');
    } catch {
      triggerNotice('error', 'Failed to synchronize financial data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Partner Name', 'Business', 'Total Earned', 'Total Paid', 'Unpaid Balance', 'Next Payout Date', 'Status'];
    const rows = partnerRows.map(p => [
      `"${p.name}"`,
      `"${p.business_name || ''}"`,
      p.earned,
      p.paid,
      p.unpaid,
      p.next_payout_date,
      p.status
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `therapick_partner_payouts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {actionNotice && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-700/60 text-emerald-200'
              : actionNotice.type === 'error'
              ? 'bg-rose-950/95 border-rose-700/60 text-rose-200'
              : 'bg-neutral-900/95 border-stone-700 text-stone-200'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Fitlo Page Header */}
      <div className="fitlo-page-head">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="fitlo-page-title">
              Affiliate Payouts
            </h1>
            <span className="fitlo-badge">
              <CalendarIcon size={12} className="text-[#0b7a73]" />
              <span>Weekly 7-Day Cycle</span>
            </span>
          </div>
          <p className="fitlo-page-subtitle">
            Track commissions, record payments, and manage weekly payouts.
          </p>
        </div>

        {/* Top Right Badges & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Refresh Action */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="fitlo-ibtn !w-9 !h-9"
            title="Refresh balances"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--ghost"
          >
            <Download size={14} className="text-[var(--fitlo-muted)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4-Tab Navigation */}
      <PayoutsTabNav 
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        counts={{
          unpaidCount: partnerRows.filter(p => p.unpaid > 0).length,
          paymentsCount: paymentRecords.length
        }}
      />

      {/* Tab Panels */}
      <div>
        {/* 1. Overview */}
        {activeTab === 'overview' && (
          <PayoutsOverviewTab 
            partnerRows={partnerRows}
            config={scheduleConfig}
            onSelectPartnerForDrawer={handleSelectPartnerForDrawer}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {/* 2. Payment History */}
        {activeTab === 'history' && (
          <PaymentHistoryTab 
            payments={paymentRecords}
            partners={partnerRows}
          />
        )}

        {/* 3. Calendar */}
        {activeTab === 'calendar' && (
          <CommissionCalendarTab 
            partnerRows={partnerRows}
            commissions={commissions}
            payments={paymentRecords}
            config={scheduleConfig}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {/* 4. Settings */}
        {activeTab === 'settings' && (
          <PayoutsSettingsTab 
            config={scheduleConfig}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        partner={selectedPartnerForRecord}
        config={scheduleConfig}
        commissions={commissions}
        bookings={bookings}
        onRecordPayment={handleRecordPayment}
      />

      {/* Partner Details Drawer */}
      <PayoutPartnerDrawer 
        partner={selectedPartnerForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        commissions={commissions}
        payments={paymentRecords}
        config={scheduleConfig}
        onOpenRecordPayment={(p) => {
          setIsDrawerOpen(false);
          handleOpenRecordPayment(p);
        }}
      />

    </div>
  );
}
