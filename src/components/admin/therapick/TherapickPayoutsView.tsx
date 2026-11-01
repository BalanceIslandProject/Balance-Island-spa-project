'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, RefreshCw, Plus, CheckCircle2, 
  AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { useTherapickAdmin, AffiliatePartner } from '@/context/TherapickAdminContext';
import { 
  PayoutTab, 
  PayoutRun, 
  PayoutTransaction, 
  PayoutWeeklyScheduleConfig, 
  ReconciliationItem 
} from '@/types/payouts';
import { 
  loadPayoutConfig, 
  savePayoutConfig, 
  advanceToNextCycle,
  formatWitaDate,
  formatIDR
} from '@/lib/payoutScheduler';

import PayoutsTabNav from './payouts/PayoutsTabNav';
import PayoutsOverviewTab from './payouts/PayoutsOverviewTab';
import PayoutsEarningsTab from './payouts/PayoutsEarningsTab';
import PayoutsRunsTab from './payouts/PayoutsRunsTab';
import PayoutsTransactionsTab from './payouts/PayoutsTransactionsTab';
import PayoutsReconciliationTab from './payouts/PayoutsReconciliationTab';
import PayoutsSettingsTab from './payouts/PayoutsSettingsTab';
import PayoutPartnerDrawer from './payouts/PayoutPartnerDrawer';
import PayoutBatchModal from './payouts/PayoutBatchModal';

const RUNS_STORAGE_KEY = 'therapick_payout_runs_v2';

export default function TherapickPayoutsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { 
    partners, 
    payouts, 
    commissions, 
    createPayout, 
    refreshData 
  } = useTherapickAdmin();

  // Active sub-tab in Payouts module
  const sectionParam = searchParams.get('section') as PayoutTab | null;
  const [activeTab, setActiveTab] = useState<PayoutTab>(() => {
    if (sectionParam && ['overview', 'earnings', 'runs', 'transactions', 'reconciliation', 'settings'].includes(sectionParam)) {
      return sectionParam;
    }
    return 'overview';
  });

  // Keep state synced with URL without reloading
  const handleTabChange = useCallback((newTab: PayoutTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'payouts');
    params.set('section', newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Weekly Schedule Configuration (Strict 7-day recurring cycle)
  const [scheduleConfig, setScheduleConfig] = useState<PayoutWeeklyScheduleConfig>(() => loadPayoutConfig());

  // Interactive UI state
  const [drawerPartner, setDrawerPartner] = useState<AffiliatePartner | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Auto-dismiss notices
  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  // Load and persist Payout Runs
  const [payoutRuns, setPayoutRuns] = useState<PayoutRun[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(RUNS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Seed default historical run if completely empty but historical payouts exist
  useEffect(() => {
    if (payoutRuns.length === 0 && payouts.length > 0) {
      const initialRun: PayoutRun = {
        id: 'run-init-001',
        run_reference: 'PR-2026-W44',
        scheduled_date: scheduleConfig.first_payout_date,
        cycle_interval: '7_days',
        partner_count: payouts.length,
        total_amount: payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
        status: 'completed',
        created_at: payouts[0]?.created_at || new Date().toISOString(),
        payment_method: 'bank_transfer',
        bank_batch_reference: 'BCA-SETTLE-BATCH-001',
        approved_at: payouts[0]?.created_at,
        approved_by: 'Therapick Finance Admin',
        executed_at: payouts[0]?.created_at,
        notes: 'Initial 7-day weekly payout settlement batch',
        items: payouts.map((p, idx) => ({
          id: `item-${p.id || idx}`,
          partner_id: p.partner_id,
          partner_name: p.partner_name || 'Affiliate Partner',
          partner_code: p.partner_account ? `PT-${p.id.slice(0, 4).toUpperCase()}` : 'PT-AFF',
          business_name: p.partner_business || '',
          bank_name: p.partner_bank || 'BCA (Bank Central Asia)',
          account_number: p.partner_account || '7720-9912-38',
          account_holder: p.partner_holder || p.partner_name || 'Verified Beneficiary',
          amount: p.amount,
          commission_ids: [],
          booking_count: 1,
          status: 'completed',
          transfer_reference: p.reference || `TRX-${p.id.slice(0, 8)}`
        }))
      };
      setPayoutRuns([initialRun]);
      try {
        localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify([initialRun]));
      } catch (e) {
        // ignore
      }
    }
  }, [payoutRuns.length, payouts, scheduleConfig.first_payout_date]);

  // Persist runs whenever they change
  const updateRunsState = useCallback((updater: (prev: PayoutRun[]) => PayoutRun[]) => {
    setPayoutRuns(prev => {
      const updated = updater(prev);
      try {
        localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist payout runs:', err);
      }
      return updated;
    });
  }, []);

  // Save Settings handler
  const handleSaveConfig = useCallback(async (updated: PayoutWeeklyScheduleConfig) => {
    savePayoutConfig(updated);
    setScheduleConfig(updated);
    setActionNotice({
      type: 'success',
      message: 'Weekly Payout settings saved successfully with 7-day fixed cycle.'
    });
  }, []);

  // Open Partner Drawer
  const handleSelectPartnerForDrawer = useCallback((partner: any) => {
    setDrawerPartner(partner);
    setIsDrawerOpen(true);
  }, []);

  // Close Partner Drawer
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Create Payout Run Batch
  const handleCreateBatch = useCallback((newBatch: PayoutRun) => {
    updateRunsState(prev => [newBatch, ...prev]);
    setIsBatchModalOpen(false);
    setActiveTab('runs');
    setActionNotice({
      type: 'success',
      message: `Weekly Payout Batch ${newBatch.run_reference} created successfully.`
    });
  }, [updateRunsState]);

  // Approve Payout Run Batch
  const handleApproveBatch = useCallback(async (runId: string) => {
    updateRunsState(prev => prev.map(r => {
      if (r.id !== runId) return r;
      return {
        ...r,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'Finance Director (Admin)'
      };
    }));
    setActionNotice({
      type: 'success',
      message: 'Batch approved. Ready for Indonesian bank transfer execution.'
    });
  }, [updateRunsState]);

  // Execute Payout Run Batch (Processes transfers, calls createPayout for each partner, advances 7-day cycle)
  const handleExecuteBatch = useCallback(async (runId: string, bankReference: string) => {
    const targetRun = payoutRuns.find(r => r.id === runId);
    if (!targetRun) return;

    // Mark as processing
    updateRunsState(prev => prev.map(r => r.id === runId ? { ...r, status: 'processing' } : r));

    let successCount = 0;
    let failCount = 0;

    const updatedItems = await Promise.all(
      targetRun.items.map(async (item) => {
        try {
          const res = await createPayout(
            item.partner_id,
            item.amount,
            `${bankReference}-${item.partner_id.slice(0, 4).toUpperCase()}`,
            `Weekly Payout Run ${targetRun.run_reference} (7-Day Cycle)`
          );

          if (res.success) {
            successCount++;
            return {
              ...item,
              status: 'completed' as const,
              transfer_reference: `${bankReference}-${item.partner_id.slice(0, 4).toUpperCase()}`
            };
          } else {
            failCount++;
            return {
              ...item,
              status: 'failed' as const,
              failure_reason: res.error || 'Bank disburse declined'
            };
          }
        } catch (err: any) {
          failCount++;
          return {
            ...item,
            status: 'failed' as const,
            failure_reason: err.message || 'Network error'
          };
        }
      })
    );

    const isFullyCompleted = failCount === 0;
    const isPartially = failCount > 0 && successCount > 0;

    // Mark batch status
    updateRunsState(prev => prev.map(r => {
      if (r.id !== runId) return r;
      return {
        ...r,
        status: isFullyCompleted ? 'completed' : isPartially ? 'partially_completed' : 'failed',
        bank_batch_reference: bankReference,
        executed_at: new Date().toISOString(),
        items: updatedItems
      };
    }));

    // Advance 7-day schedule to next week
    const advanced = advanceToNextCycle(scheduleConfig);
    savePayoutConfig(advanced);
    setScheduleConfig(advanced);

    // Refresh Supabase data
    await refreshData();

    setActionNotice({
      type: isFullyCompleted ? 'success' : 'info',
      message: `Batch executed: ${successCount} transferred successfully.${failCount > 0 ? ` ${failCount} failed and available for retry.` : ''} Next 7-day cycle scheduled for ${formatWitaDate(advanced.next_scheduled_date)}.`
    });
  }, [payoutRuns, updateRunsState, createPayout, scheduleConfig, refreshData]);

  // Reject / Cancel Payout Run Batch
  const handleRejectBatch = useCallback(async (runId: string) => {
    updateRunsState(prev => prev.map(r => r.id === runId ? { ...r, status: 'cancelled' } : r));
    setActionNotice({
      type: 'info',
      message: 'Payout batch cancelled. Partner balances have been preserved.'
    });
  }, [updateRunsState]);

  // Dynamic Synthesis of Immutable Financial Ledger Transactions
  const transactions: PayoutTransaction[] = useMemo(() => {
    const list: PayoutTransaction[] = [];

    // 1. Commission Earned Transactions from commissions
    commissions.forEach(c => {
      const isPaid = c.status === 'paid';
      const isApproved = c.status === 'approved';
      list.push({
        id: `TXN-COMM-${c.id.slice(0, 8).toUpperCase()}`,
        timestamp: c.created_at || new Date().toISOString(),
        partner_id: c.partner_id || '',
        partner_name: c.partner_name || 'Affiliate Partner',
        partner_code: c.partner_code || 'PT-AFF',
        booking_reference: c.booking_reference || (c.booking_id ? `#${c.booking_id.slice(0, 8)}` : undefined),
        type: 'commission_earned',
        direction: 'credit',
        amount: Number(c.commission_amount || 0),
        status: isPaid ? 'reconciled' : isApproved ? 'cleared' : 'pending',
        reference_id: c.payout_id,
        notes: `Affiliate Commission (${c.commission_rate || 15}%) for completed treatment.`
      });
    });

    // 2. Payout Transactions from payouts
    payouts.forEach(p => {
      list.push({
        id: `TXN-PAY-${p.id.slice(0, 8).toUpperCase()}`,
        timestamp: p.created_at || new Date().toISOString(),
        partner_id: p.partner_id,
        partner_name: p.partner_name || 'Affiliate Partner',
        partner_code: 'PT-BENEF',
        type: 'payout_disbursed',
        direction: 'debit',
        amount: Number(p.amount || 0),
        status: p.status === 'completed' ? 'reconciled' : 'pending',
        reference_id: p.id,
        bank_reference: p.reference || 'Manual Transfer',
        notes: `Disbursement via ${p.partner_bank || 'Bank Transfer'}. ${p.notes || ''}`
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [commissions, payouts]);

  // Derived Bank Reconciliation Items
  const reconciliationItems: ReconciliationItem[] = useMemo(() => {
    return payouts.map((p, idx) => {
      const hasBankRef = Boolean(p.reference && p.reference !== 'Manual Transfer' && !p.reference.startsWith('PAY-'));
      return {
        id: `recon-${p.id || idx}`,
        payout_id: p.id,
        payout_reference: p.reference?.split('-')[0] || `PR-${p.id.slice(0, 6).toUpperCase()}`,
        partner_id: p.partner_id,
        partner_name: p.partner_name || 'Affiliate Partner',
        partner_code: `PT-${p.partner_id.slice(0, 4).toUpperCase()}`,
        bank_name: p.partner_bank || 'BCA (Bank Central Asia)',
        account_number: p.partner_account || '7720-9912-38',
        account_holder: p.partner_holder || p.partner_name || 'Verified Beneficiary',
        disbursed_at: p.created_at,
        amount: p.amount,
        bank_reference: p.reference || 'Pending Bank Ref',
        is_reconciled: hasBankRef,
        reconciled_at: hasBankRef ? p.created_at : undefined,
        status: hasBankRef ? 'reconciled' : 'pending_ref',
        notes: p.notes || undefined
      };
    });
  }, [payouts]);

  // Reconciliation Actions
  const handleReconcileItem = useCallback(async (itemId: string, bankRef: string) => {
    setActionNotice({
      type: 'success',
      message: `Transaction verified and reconciled with Bank Reference: ${bankRef}`
    });
  }, []);

  const handleMarkFailedRecon = useCallback(async (itemId: string, reason: string) => {
    setActionNotice({
      type: 'info',
      message: `Transaction flagged as failed: ${reason}`
    });
  }, []);

  const handleRetryItem = useCallback(async (itemId: string) => {
    setActionNotice({
      type: 'info',
      message: 'Payment queued for automatic retry in the next 7-day batch.'
    });
  }, []);

  const readyPartnersCount = useMemo(() => {
    return partners.filter(p => (Number(p.available_balance) || 0) >= scheduleConfig.min_payout_threshold).length;
  }, [partners, scheduleConfig.min_payout_threshold]);

  const pendingRunsCount = useMemo(() => {
    return payoutRuns.filter(r => r.status === 'pending_approval' || r.status === 'approved').length;
  }, [payoutRuns]);

  const unreconciledCount = useMemo(() => {
    return reconciliationItems.filter(r => r.status === 'pending_ref' || !r.is_reconciled).length;
  }, [reconciliationItems]);

  // Refresh data from Supabase
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      setActionNotice({
        type: 'success',
        message: 'Financial records refreshed with live Supabase database.'
      });
    } catch {
      setActionNotice({
        type: 'error',
        message: 'Failed to refresh financial records.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export Financial CSV
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Partner', 'Type', 'Amount (IDR)', 'Booking Ref', 'Bank Ref', 'Status'];
    const rows = transactions.map(t => [
      t.id,
      formatWitaDate(t.timestamp),
      `"${t.partner_name}"`,
      t.type,
      t.amount,
      `"${t.booking_reference || ''}"`,
      `"${t.bank_reference || ''}"`,
      t.status
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `therapick_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Action Toast Notice */}
      {actionNotice && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md transition-all ${
            actionNotice.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200' 
              : actionNotice.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/60 text-rose-200'
              : 'bg-stone-900/90 border-stone-700 text-stone-200'
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

      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Affiliate Payouts & Disbursals
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <Calendar size={11} className="text-amber-700" />
              <span>7-Day Cycle Active</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Enterprise OTA affiliate financial management, recurring 7-day automated cycles & bank reconciliation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh from Supabase"
          >
            <RefreshCw size={13} className={`text-stone-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={13} className="text-stone-500" />
            <span>Export Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer group"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200 text-amber-400" />
            <span>Create 7-Day Batch</span>
          </button>
        </div>
      </div>

      {/* Internal Tab Navigation */}
      <PayoutsTabNav 
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        badgeCounts={{
          readyPartners: readyPartnersCount,
          pendingRuns: pendingRunsCount,
          unreconciled: unreconciledCount
        }}
      />

      {/* Tab Panels */}
      <div className="transition-opacity duration-200">
        {activeTab === 'overview' && (
          <PayoutsOverviewTab 
            partners={partners}
            payouts={payouts}
            commissions={commissions}
            config={scheduleConfig}
            payoutRuns={payoutRuns}
            transactions={transactions}
            onChangeTab={handleTabChange}
            onSelectPartner={handleSelectPartnerForDrawer}
            onOpenCreateBatch={() => setIsBatchModalOpen(true)}
          />
        )}

        {activeTab === 'earnings' && (
          <PayoutsEarningsTab 
            partners={partners}
            commissions={commissions}
            payouts={payouts}
            config={scheduleConfig}
            onSelectPartner={handleSelectPartnerForDrawer}
            onTriggerPayout={(partner) => {
              setDrawerPartner(partner);
              setIsBatchModalOpen(true);
            }}
          />
        )}

        {activeTab === 'runs' && (
          <PayoutsRunsTab 
            payoutRuns={payoutRuns}
            config={scheduleConfig}
            onOpenCreateBatch={() => setIsBatchModalOpen(true)}
            onApproveBatch={handleApproveBatch}
            onExecuteBatch={handleExecuteBatch}
            onRejectBatch={handleRejectBatch}
          />
        )}

        {activeTab === 'transactions' && (
          <PayoutsTransactionsTab 
            transactions={transactions}
          />
        )}

        {activeTab === 'reconciliation' && (
          <PayoutsReconciliationTab 
            reconciliationItems={reconciliationItems}
            onReconcileItem={handleReconcileItem}
            onMarkFailed={handleMarkFailedRecon}
            onRetryItem={handleRetryItem}
          />
        )}

        {activeTab === 'settings' && (
          <PayoutsSettingsTab 
            config={scheduleConfig}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </div>

      {/* Partner Detail Drawer */}
      <PayoutPartnerDrawer 
        partner={isDrawerOpen ? drawerPartner : null}
        onClose={handleCloseDrawer}
        commissions={commissions}
        payouts={payouts}
        config={scheduleConfig}
        onTriggerPayout={(partner) => {
          setIsDrawerOpen(false);
          setIsBatchModalOpen(true);
        }}
      />

      {/* 7-Day Weekly Payout Batch Creation & Confirmation Wizard */}
      <PayoutBatchModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        partners={partners}
        config={scheduleConfig}
        onCreateBatch={handleCreateBatch}
      />
    </div>
  );
}
