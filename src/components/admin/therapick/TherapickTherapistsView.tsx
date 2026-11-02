'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Search, Edit3, Trash2, Check, RefreshCw, X, PlusCircle
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickTherapistsView() {
  const { 
    treatments, 
    therapistFees, 
    saveTherapistFee, 
    deleteTherapistFee, 
    refreshData, 
    loading 
  } = useTherapickAdmin();

  const [feeSearch, setFeeSearch] = useState('');
  const [editingFee, setEditingFee] = useState<{ id: string; duration: string } | null>(null);
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Normalize duration helper
  const norm = (d: string | number) => String(d || '').replace(/min/i, '').replace(/s/i, '').trim();

  // Find fee object matching treatment and duration
  const getFeeObj = (treatmentId: string, duration: string) => {
    const targetNorm = norm(duration);
    return therapistFees.find(f => 
      f.treatment_id === treatmentId && 
      (norm(f.duration) === targetNorm || String(f.duration).trim() === String(duration).trim())
    );
  };

  const handleSaveFee = async (treatmentId: string, duration: string) => {
    const key = `${treatmentId}-${duration}`;
    const rawVal = feeInputs[key];
    const cleanFee = String(rawVal || '').trim();

    if (!cleanFee) return;

    setSavingKey(key);
    try {
      const res = await saveTherapistFee(treatmentId, duration, cleanFee);
      if (res.success) {
        setEditingFee(null);
        await refreshData();
      }
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteFee = async (treatmentId: string, duration: string) => {
    const feeObj = getFeeObj(treatmentId, duration);
    if (!feeObj) return;

    if (!confirm('Are you sure you want to remove this therapist fee?')) return;

    const res = await deleteTherapistFee(feeObj.id);
    if (res.success) {
      await refreshData();
    }
  };

  // Filtered treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => 
      t.title.toLowerCase().includes(feeSearch.toLowerCase()) || 
      (t.category && t.category.toLowerCase().includes(feeSearch.toLowerCase()))
    );
  }, [treatments, feeSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER (MATCHING IMAGE 1)
         ───────────────────────────────────────────────────────────── */}
      {/* Fitlo Page Header */}
      <div className="fitlo-page-head">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="fitlo-page-title">
              Therapist Fee Setup
            </h1>
            <span className="fitlo-badge">
              <DollarSign size={12} className="text-[#0b7a73]" />
              <span>Wage Configuration</span>
            </span>
          </div>
          <p className="fitlo-page-subtitle">
            Configure wage payouts per treatment duration tier for therapists.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fitlo-muted)]" />
            <input
              type="text"
              placeholder="Search treatments..."
              value={feeSearch}
              onChange={e => setFeeSearch(e.target.value)}
              className="w-full bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[var(--fitlo-ink)] placeholder:text-[var(--fitlo-muted)] focus:outline-none focus:border-[var(--fitlo-accent)] transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => refreshData()}
            className="fitlo-btn fitlo-btn--ghost !h-9 !px-3"
            title="Sync with database"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#0b7a73]' : 'text-[var(--fitlo-muted)]'} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Fitlo Tinted KPI Tiles */}
      <div className="fitlo-kpis !grid-cols-3">
        <div className="fitlo-kpi fitlo-kpi--1">
          <div className="fitlo-kpi__label">
            <span>Total Treatments</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            {treatments.length}
          </div>
          <div className="fitlo-kpi__foot">In current brand catalog</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--2">
          <div className="fitlo-kpi__label">
            <span>Wage Tiers Set</span>
          </div>
          <div className="fitlo-kpi__value fitlo-num">
            {therapistFees.length}
          </div>
          <div className="fitlo-kpi__foot">Custom payouts defined</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--4">
          <div className="fitlo-kpi__label">
            <span>Active Brand</span>
          </div>
          <div className="fitlo-kpi__value text-lg flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0b7a73]" />
            <span>Therapick</span>
          </div>
          <div className="fitlo-kpi__foot">Website database scope</div>
        </div>
      </div>

      {/* TREATMENT FEE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTreatments.length === 0 ? (
          <div className="col-span-full fitlo-card p-12 text-center text-[var(--fitlo-muted)]">
            <DollarSign size={28} className="mx-auto mb-2 text-[var(--fitlo-muted)] opacity-40" />
            <p className="font-semibold text-[var(--fitlo-ink)]">No treatments match your search</p>
            <p className="text-xs text-[var(--fitlo-muted)] mt-1">Try another keyword.</p>
          </div>
        ) : (
          filteredTreatments.map(t => {
            const options = Array.isArray(t.options) ? t.options : [];

            return (
              <div 
                key={t.id} 
                className="fitlo-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h4 className="font-bold text-[var(--fitlo-ink)] text-sm uppercase tracking-tight">
                      {t.title}
                    </h4>
                    <span className="fitlo-badge shrink-0">
                      {t.category || 'Package'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-[var(--fitlo-line)] rounded-xl overflow-hidden bg-[var(--fitlo-card)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--fitlo-card-2)] border-b border-[var(--fitlo-line)]">
                        <tr>
                          <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">
                            Duration
                          </th>
                          <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] text-right">
                            Fee (IDR)
                          </th>
                          <th className="py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)] text-right w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--fitlo-line)]">
                        {options.map(opt => {
                          const durationStr = String(opt.duration || '').trim();
                          const key = `${t.id}-${durationStr}`;
                          const isEditing = editingFee?.id === t.id && editingFee?.duration === durationStr;
                          const feeObj = getFeeObj(t.id, durationStr);
                          
                          let feeValue = '-';
                          if (feeObj && feeObj.fee) {
                            const rawNumeric = parseInt(String(feeObj.fee).replace(/,/g, '') || '0', 10);
                            feeValue = !isNaN(rawNumeric) && rawNumeric > 0 ? rawNumeric.toLocaleString('en-US') : '-';
                          }

                          const isSaving = savingKey === key;

                          return (
                            <tr key={durationStr} className="hover:bg-[var(--fitlo-card-2)] transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-[var(--fitlo-ink)]">
                                {durationStr} mins
                              </td>

                              <td className="py-2.5 px-3 font-bold fitlo-num text-[var(--fitlo-ink)] text-right">
                                {isEditing ? (
                                  <input 
                                    type="text"
                                    autoFocus
                                    placeholder="e.g. 150,000"
                                    value={feeInputs[key] || ''}
                                    onChange={e => setFeeInputs({ ...feeInputs, [key]: e.target.value })}
                                    className="h-7 text-xs text-right py-0.5 px-2 w-24 border border-[var(--fitlo-line-2)] rounded bg-[var(--fitlo-card)] text-[var(--fitlo-ink)] focus:outline-none focus:border-[var(--fitlo-accent)] inline-block font-mono"
                                  />
                                ) : (
                                  feeValue
                                )}
                              </td>

                              <td className="py-2.5 px-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveFee(t.id, durationStr)}
                                        disabled={isSaving}
                                        className="h-6 px-2 text-[11px] font-bold rounded bg-[#0b7a73] text-white hover:bg-[#08665f] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        {isSaving ? <RefreshCw size={10} className="animate-spin text-white" /> : <Check size={11} />}
                                        <span>Save</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingFee(null)}
                                        className="h-6 px-1.5 text-[11px] font-medium rounded border border-[var(--fitlo-line)] bg-[var(--fitlo-card)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFeeInputs(prev => ({ 
                                            ...prev, 
                                            [key]: feeObj ? String(feeObj.fee).replace(/,/g, '') : '' 
                                          }));
                                          setEditingFee({ id: t.id, duration: durationStr });
                                        }}
                                        className="p-1 rounded text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
                                        title={feeObj ? 'Edit Fee' : 'Add Fee'}
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      {feeObj && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFee(t.id, durationStr)}
                                          className="p-1 rounded text-[var(--fitlo-muted)] hover:text-[var(--fitlo-bad)] hover:bg-[var(--fitlo-bad-soft)] transition-colors cursor-pointer"
                                          title="Delete Fee"
                                        >
                                          <Trash2 size={13} className="text-[var(--fitlo-bad)]" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
