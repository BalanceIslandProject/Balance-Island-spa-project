'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Wallet, 
  Building2, 
  User, 
  CreditCard, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar 
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickCreatePayoutModal() {
  const {
    isCreatePayoutOpen,
    setIsCreatePayoutOpen,
    createPayout,
    partners,
    selectedPartner,
    setSelectedPartner
  } = useTherapickAdmin();

  const [partnerId, setPartnerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [payoutDate, setPayoutDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '2026-11-01';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modern Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Sync default selected partner
  useEffect(() => {
    if (selectedPartner) {
      setPartnerId(selectedPartner.id);
      setAmount(selectedPartner.available_balance || 0);
    } else if (partners.length > 0 && !partnerId) {
      setPartnerId(partners[0].id);
      setAmount(partners[0].available_balance || 0);
    }
  }, [selectedPartner, partners]);

  const activePartner = partners.find(p => p.id === partnerId) || partners[0];

  useEffect(() => {
    if (activePartner && !selectedPartner) {
      setAmount(activePartner.available_balance || 0);
    }
  }, [activePartner]);

  if (!isCreatePayoutOpen) return null;

  const filteredPartners = partners.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.business_name && p.business_name.toLowerCase().includes(q)) ||
      (p.partner_code && p.partner_code.toLowerCase().includes(q)) ||
      (p.referral_code && p.referral_code.toLowerCase().includes(q))
    );
  });

  const getInitials = (name?: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner) return;
    if (amount <= 0) {
      alert('Payout amount must be greater than Rp 0.');
      return;
    }

    setIsSubmitting(true);
    const res = await createPayout(
      activePartner.id,
      amount,
      reference.trim() || `BCA-${Date.now().toString().slice(-6)}`,
      notes.trim() || undefined,
      payoutDate
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Payout of Rp ${amount.toLocaleString('id-ID')} recorded!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsCreatePayoutOpen(false);
      }, 1100);
    } else {
      alert(res.error || 'Failed to record payout.');
    }
  };

  return (
    <div className="fitlo-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[var(--fitlo-card,#fdfdfb)] rounded-2xl shadow-2xl border border-[var(--fitlo-line,rgba(22,26,25,0.08))] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--fitlo-line,rgba(22,26,25,0.08))] flex items-center justify-between bg-[var(--fitlo-bg,#f7f6f2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--fitlo-accent-soft,#d8ecee)] text-[var(--fitlo-accent,#0b7a73)] flex items-center justify-center shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--fitlo-ink,#161a19)] tracking-tight">Record Partner Payout</h3>
              <p className="text-[11px] text-[var(--fitlo-muted,#59615d)]">
                Disburse commission and update partner ledger.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsCreatePayoutOpen(false)}
            className="p-1.5 text-[var(--fitlo-muted,#59615d)] hover:text-[var(--fitlo-ink,#161a19)] hover:bg-[var(--fitlo-card-2,#f0efea)] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Modern Select Partner Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-[var(--fitlo-muted,#59615d)] mb-1 uppercase font-mono tracking-wider">
              Select Partner
            </label>

            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[var(--fitlo-bg,#f7f6f2)] hover:bg-[var(--fitlo-card-2,#f0efea)] border border-[var(--fitlo-line,rgba(22,26,25,0.08))] rounded-xl p-2.5 text-left flex items-center justify-between transition-colors cursor-pointer group focus:outline-none focus:border-[var(--fitlo-accent,#0b7a73)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--fitlo-accent-soft,#d8ecee)] text-[var(--fitlo-accent,#0b7a73)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--fitlo-accent,#0b7a73)]/20">
                  {getInitials(activePartner?.name)}
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-bold text-[var(--fitlo-ink,#161a19)] truncate">
                    {activePartner?.name || 'Choose Partner'}
                  </div>
                  <div className="text-[10px] text-[var(--fitlo-muted,#59615d)] truncate">
                    {activePartner?.business_name || 'Individual'} · {activePartner?.partner_code || activePartner?.referral_code || 'PARTNER'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="fitlo-pill fitlo-pill--paid text-[10px] font-bold">
                  Rp {(activePartner?.available_balance || 0).toLocaleString('id-ID')}
                </span>
                {isDropdownOpen ? (
                  <ChevronUp size={16} className="text-[var(--fitlo-muted,#59615d)] group-hover:text-[var(--fitlo-ink,#161a19)]" />
                ) : (
                  <ChevronDown size={16} className="text-[var(--fitlo-muted,#59615d)] group-hover:text-[var(--fitlo-ink,#161a19)]" />
                )}
              </div>
            </button>

            {/* Custom Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--fitlo-card,#fdfdfb)] border border-[var(--fitlo-line,rgba(22,26,25,0.08))] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search Box */}
                <div className="p-2 border-b border-[var(--fitlo-line,rgba(22,26,25,0.08))] bg-[var(--fitlo-bg,#f7f6f2)] flex items-center gap-2">
                  <Search size={14} className="text-[var(--fitlo-muted,#59615d)] shrink-0 ml-1" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search partner, property, or code..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent border-none text-[var(--fitlo-ink,#161a19)] placeholder:text-[var(--fitlo-muted,#59615d)] focus:outline-none py-1"
                  />
                </div>

                {/* Partners List */}
                <div className="max-h-52 overflow-y-auto divide-y divide-[var(--fitlo-line,rgba(22,26,25,0.08))] p-1">
                  {filteredPartners.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[var(--fitlo-muted,#59615d)]">
                      No matching partners found
                    </div>
                  ) : (
                    filteredPartners.map(p => {
                      const isSelected = p.id === partnerId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPartnerId(p.id);
                            setAmount(p.available_balance || 0);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-[var(--fitlo-accent-soft,#d8ecee)]/50 text-[var(--fitlo-accent,#0b7a73)] font-semibold' : 'hover:bg-[var(--fitlo-bg,#f7f6f2)] text-[var(--fitlo-ink,#161a19)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[var(--fitlo-accent,#0b7a73)] text-white' : 'bg-[var(--fitlo-card-2,#f0efea)] text-[var(--fitlo-ink,#161a19)]'
                            }`}>
                              {getInitials(p.name)}
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="text-xs truncate font-bold">{p.name}</div>
                              <div className="text-[10px] text-[var(--fitlo-muted,#59615d)] truncate">
                                {p.business_name || 'Partner'} · {p.partner_code || p.referral_code || ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-mono font-bold text-[var(--fitlo-accent,#0b7a73)]">
                              Rp {(p.available_balance || 0).toLocaleString('id-ID')}
                            </span>
                            {isSelected && <Check size={14} className="text-[var(--fitlo-accent,#0b7a73)] shrink-0" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bank Account Verification Card */}
          {activePartner && (
            <div className="p-3 rounded-xl bg-[var(--fitlo-bg,#f7f6f2)] border border-[var(--fitlo-line,rgba(22,26,25,0.08))] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--fitlo-ink,#161a19)]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Building2 size={13} className="text-[var(--fitlo-muted,#59615d)]" />
                  Bank Destination
                </span>
                <span className="fitlo-pill fitlo-pill--paid text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck size={11} />
                  Verified
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[var(--fitlo-muted,#59615d)] block text-[9px] uppercase font-mono">Bank</span>
                  <span className="font-bold text-[var(--fitlo-ink,#161a19)]">{activePartner.bank_name || 'BCA (Bank Central Asia)'}</span>
                </div>
                <div>
                  <span className="text-[var(--fitlo-muted,#59615d)] block text-[9px] uppercase font-mono">Account Holder</span>
                  <span className="font-bold text-[var(--fitlo-ink,#161a19)] truncate block">{activePartner.bank_holder || activePartner.name}</span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[var(--fitlo-muted,#59615d)] block text-[9px] uppercase font-mono">Account Number</span>
                  <span className="font-mono font-bold text-[var(--fitlo-ink,#161a19)]">{activePartner.bank_number || '7720-1928-4491'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Available vs Disbursement Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--fitlo-muted,#59615d)] mb-1">
                Available Balance
              </label>
              <div className="p-2.5 bg-[var(--fitlo-card-2,#f0efea)] border border-[var(--fitlo-line,rgba(22,26,25,0.08))] rounded-xl text-[var(--fitlo-ink,#161a19)] font-bold text-xs sm:text-sm font-mono">
                Rp {(activePartner?.available_balance || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--fitlo-ink,#161a19)] mb-1">
                Disbursement Amount (IDR) *
              </label>
              <input
                type="number"
                step="1000"
                max={activePartner?.available_balance || 0}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="fitlo-input w-full text-xs sm:text-sm font-bold font-mono"
              />
            </div>
          </div>

          {/* Settlement Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--fitlo-ink,#161a19)] mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-[var(--fitlo-muted,#59615d)]" />
                Settlement / Payout Date *
              </label>
              <input
                type="date"
                required
                value={payoutDate}
                onChange={e => setPayoutDate(e.target.value)}
                className="fitlo-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--fitlo-ink,#161a19)] mb-1">
                Transfer Reference / ID
              </label>
              <input
                type="text"
                placeholder="e.g. BCA-TRX-948102"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="fitlo-input w-full text-xs"
              />
            </div>
          </div>

          {/* Internal Payout Note */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--fitlo-ink,#161a19)] mb-1">
              Internal Payout Note
            </label>
            <input
              type="text"
              placeholder="e.g. Bi-weekly commission settlement"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="fitlo-input w-full text-xs"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[var(--fitlo-line,rgba(22,26,25,0.08))] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreatePayoutOpen(false)}
              className="fitlo-btn fitlo-btn--ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="fitlo-btn fitlo-btn--primary text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Confirm Payout</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
