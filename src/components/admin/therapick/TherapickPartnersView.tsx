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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Partner Directory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage villas, concierge desks, and affiliates with direct calendar tracking and commission payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-stone-500" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Total Partners</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">{partners.length}</div>
          <div className="text-xs text-stone-400 mt-1">Verified partner network</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">Active Partners</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {partners.filter(p => p.status === 'active').length}
          </div>
          <div className="text-xs text-stone-400 mt-1">Generating referrals</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {partners.filter(p => p.status === 'pending').length}
          </div>
          <div className="text-xs text-stone-400 mt-1">Awaiting approval</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Total Balance Payable</div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
            Rp {partners.reduce((sum, p) => sum + (p.available_balance || 0), 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-1">Across all active partners</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, business, or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-stone-50/70 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-stone-100/90 rounded-xl">
          {(['all', 'active', 'pending', 'suspended'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Partner & Business</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4 text-center">Bookings</th>
                <th className="py-3 px-4">Affiliate Revenue</th>
                <th className="py-3 px-4">Commission (15%)</th>
                <th className="py-3 px-4">Available Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <Users size={28} className="mx-auto mb-2 text-stone-300" />
                    <p className="font-semibold text-stone-600">No partners match current filter</p>
                  </td>
                </tr>
              ) : (
                filteredPartners.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPartner(p)}
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                  >
                    {/* Partner & Business */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Building2 size={11} className="text-stone-400 shrink-0" />
                        <span>{p.business_name || 'Individual Concierge'}</span>
                      </div>
                    </td>

                    {/* Referral Code */}
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={e => copyReferral(p.referral_code, e)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 font-mono font-bold text-xs text-neutral-800 transition-colors cursor-pointer"
                        title="Copy Referral Link"
                      >
                        <span>{p.referral_code}</span>
                        {copiedCode === p.referral_code ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} className="text-stone-400" />
                        )}
                      </button>
                    </td>

                    {/* Bookings */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold font-mono text-neutral-900 bg-stone-100 px-2.5 py-1 rounded-full text-xs">
                        {p.total_bookings}
                      </span>
                    </td>

                    {/* Affiliate Revenue */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-mono text-neutral-900">
                        Rp {p.affiliate_revenue.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Commission */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-mono text-amber-700">
                        Rp {p.commission_earned.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Available Balance */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-mono text-emerald-700">
                        Rp {(p.available_balance || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Paid: Rp {(p.paid_amount || 0).toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        p.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'active' ? 'bg-emerald-500' :
                          p.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => updatePartnerStatus(p.id, 'active')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {p.status === 'active' && (p.available_balance || 0) > 0 && (
                          <button
                            type="button"
                            onClick={e => handlePayoutShortcut(p, e)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#facc15] hover:bg-[#eab308] text-neutral-950 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Disburse Payout"
                          >
                            <Wallet size={12} />
                            <span>Payout</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedPartner(p)}
                          className="p-1.5 text-stone-400 hover:text-neutral-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                          title="View Profile Drawer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
