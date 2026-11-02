'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, ExternalLink, Copy, Check, ChevronRight, 
  Wallet, ShieldCheck, UserCheck, AlertTriangle, Trash2, Download, Building2
} from 'lucide-react';
import { useTherapickAdmin, AffiliatePartner } from '@/context/TherapickAdminContext';

export default function TherapickPartnersView() {
  const { 
    partners, 
    setSelectedPartner, 
    updatePartnerStatus, 
    deletePartner, 
    setIsCreatePayoutOpen 
  } = useTherapickAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesBiz = p.business_name?.toLowerCase().includes(q);
        const matchesCode = p.referral_code?.toLowerCase().includes(q);
        const matchesEmail = p.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesBiz && !matchesCode && !matchesEmail) return false;
      }
      return true;
    });
  }, [partners, statusFilter, searchQuery]);

  const copyReferral = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://booktherapick.com/?ref=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePayoutShortcut = (partner: AffiliatePartner, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPartner(partner);
    setIsCreatePayoutOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Partner ID', 'Name', 'Business Name', 'Referral Code', 'Email', 'Phone', 'Bank', 'Account No', 'Total Bookings', 'Revenue', 'Commission', 'Available Balance', 'Status'];
    const rows = filteredPartners.map(p => [
      p.id,
      `"${p.name}"`,
      `"${p.business_name || ''}"`,
      p.referral_code,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.bank_name || ''}"`,
      `"${p.bank_number || ''}"`,
      p.total_bookings,
      p.affiliate_revenue,
      p.commission_earned,
      p.available_balance,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `therapick_partners_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Fitlo Page Header */}
      <div className="fitlo-page-head">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="fitlo-page-title">
              Partner Directory
            </h1>
            <span className="fitlo-badge">
              <Users size={12} className="text-[#0b7a73]" />
              <span>Affiliate Network</span>
            </span>
          </div>
          <p className="fitlo-page-subtitle">
            Manage villas, concierge desks, and affiliates with direct calendar tracking and commission payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--ghost"
          >
            <Download size={14} className="text-[var(--fitlo-muted)]" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
        </div>
      </div>

      {/* Fitlo 4 Pastel Tinted KPI Tiles */}
      <div className="fitlo-kpis">
        <div className="fitlo-kpi fitlo-kpi--1">
          <div className="fitlo-kpi__label">
            <Users size={14} />
            <span>Total Partners</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">{partners.length}</div>
          <div className="fitlo-kpi__foot">
            <span>Verified partner network</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--2">
          <div className="fitlo-kpi__label">
            <UserCheck size={14} />
            <span>Active Partners</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            {partners.filter(p => p.status === 'active').length}
          </div>
          <div className="fitlo-kpi__foot">
            <span>Generating active bookings</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--3">
          <div className="fitlo-kpi__label">
            <ShieldCheck size={14} />
            <span>Pending Review</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            {partners.filter(p => p.status === 'pending').length}
          </div>
          <div className="fitlo-kpi__foot">
            <span>Awaiting administrator approval</span>
          </div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--4">
          <div className="fitlo-kpi__label">
            <Wallet size={14} />
            <span>Payable Balance</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            Rp {partners.reduce((sum, p) => sum + (p.available_balance || 0), 0).toLocaleString('id-ID')}
          </div>
          <div className="fitlo-kpi__foot">
            <span>Across all active partners</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="fitlo-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-[var(--fitlo-muted)]" />
          <input
            type="text"
            placeholder="Search by name, business, or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] rounded-xl pl-9 pr-3 py-2.5 text-[var(--fitlo-ink)] placeholder:text-[var(--fitlo-muted)] focus:outline-none focus:border-[var(--fitlo-accent)] focus:bg-[var(--fitlo-card)] transition-all"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="fitlo-sides !p-1 w-full sm:w-auto">
          {(['all', 'active', 'pending', 'suspended'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`!h-8 !px-3 text-xs capitalize ${
                statusFilter === tab ? 'is-active !font-bold' : ''
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Table Card (Fitlo Table) */}
      <div className="fitlo-card fitlo-card--flush">
        <div className="fitlo-table-wrap">
          <table className="fitlo-table min-w-[900px]">
            <thead>
              <tr>
                <th>Partner & Business</th>
                <th>Referral Code</th>
                <th style={{ textAlign: 'center' }}>Bookings</th>
                <th>Affiliate Revenue</th>
                <th>Commission (15%)</th>
                <th>Available Balance</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[var(--fitlo-muted)]">
                    <Users size={28} className="mx-auto mb-2 text-[var(--fitlo-muted)] opacity-40" />
                    <p className="font-semibold text-[var(--fitlo-ink)]">No partners match current filter</p>
                  </td>
                </tr>
              ) : (
                filteredPartners.map(p => {
                  const partnerName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.business_name || 'Partner';
                  const bookingCount = p.total_bookings ?? 0;
                  const revNum = Number(p.affiliate_revenue) || 0;
                  const commNum = Number(p.commission_earned) || 0;
                  const balNum = Number(p.available_balance) || 0;
                  const paidNum = Number(p.paid_amount) || 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPartner(p)}
                      className="cursor-pointer group"
                    >
                      {/* Partner & Business */}
                      <td>
                        <div className="font-bold text-[var(--fitlo-ink)] flex items-center gap-1.5">
                          <span>{partnerName}</span>
                        </div>
                        <div className="text-[11px] text-[var(--fitlo-muted)] flex items-center gap-1 mt-0.5">
                          <Building2 size={11} className="text-[var(--fitlo-muted)] shrink-0" />
                          <span>{p.business_name || 'Individual Concierge'}</span>
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={e => copyReferral(p.referral_code, e)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--fitlo-card-2)] hover:bg-[var(--fitlo-card-3)] font-mono font-bold text-xs text-[var(--fitlo-ink)] transition-colors cursor-pointer border border-[var(--fitlo-line)]"
                          title="Copy Referral Link"
                        >
                          <span>{p.referral_code}</span>
                          {copiedCode === p.referral_code ? (
                            <Check size={12} className="text-[var(--fitlo-good)]" />
                          ) : (
                            <Copy size={12} className="text-[var(--fitlo-muted)]" />
                          )}
                        </button>
                      </td>

                      {/* Bookings */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="font-bold fitlo-num text-[var(--fitlo-ink)] bg-[var(--fitlo-card-2)] px-2.5 py-1 rounded-full text-xs">
                          {bookingCount}
                        </span>
                      </td>

                      {/* Affiliate Revenue */}
                      <td>
                        <div className="font-bold fitlo-num text-[var(--fitlo-ink)]">
                          Rp {revNum.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Commission */}
                      <td>
                        <div className="font-bold fitlo-num text-[var(--fitlo-accent-text)]">
                          Rp {commNum.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Available Balance */}
                      <td>
                        <div className="font-bold fitlo-num text-[var(--fitlo-good)]">
                          Rp {balNum.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-[var(--fitlo-muted)]">
                          Paid: Rp {paidNum.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`fitlo-pill ${
                          p.status === 'active'
                            ? 'fitlo-pill--good'
                            : p.status === 'pending'
                            ? 'fitlo-pill--warn'
                            : 'fitlo-pill--bad'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="r" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updatePartnerStatus(p.id, 'active')}
                              className="fitlo-btn fitlo-btn--primary !h-7 !px-2.5 !text-xs"
                            >
                              Approve
                            </button>
                          )}
                          {p.status === 'active' && (p.available_balance || 0) > 0 && (
                            <button
                              type="button"
                              onClick={e => handlePayoutShortcut(p, e)}
                              className="fitlo-btn fitlo-btn--primary !h-7 !px-2.5 !text-xs !bg-[#0b7a73]"
                              title="Disburse Payout"
                            >
                              <Wallet size={12} />
                              <span>Payout</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedPartner(p)}
                            className="p-1.5 text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] rounded-lg hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
                            title="View Profile Drawer"
                          >
                            <ChevronRight size={16} />
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
    </div>
  );
}
