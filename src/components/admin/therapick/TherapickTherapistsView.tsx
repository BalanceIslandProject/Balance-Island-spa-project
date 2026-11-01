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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black">
            Therapist Fee Setup
          </h1>
          <p className="text-[13px] text-[#737373] mt-0.5">
            Configure wage payouts per treatment duration tier for therapists.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search treatments..."
              value={feeSearch}
              onChange={e => setFeeSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E5E5] rounded-lg pl-9 pr-3 py-2 text-xs text-black placeholder:text-[#A3A3A3] focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => refreshData()}
            className="px-3 py-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-black flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Sync with database"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-amber-500' : 'text-[#737373]'} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          METRICS STRIP (MATCHING IMAGE 1)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 border border-[#E5E5E5] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5] bg-white overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Total Treatments
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
            {treatments.length}
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">In current brand catalog</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Wage Tiers Set
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1">
            {therapistFees.length}
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">Custom payouts defined</div>
        </div>

        <div className="p-4 sm:p-5 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Active Brand
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-black mt-1 flex items-center gap-1.5 capitalize">
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
            <span>Therapick</span>
          </div>
          <div className="text-[11px] text-[#737373] mt-0.5">Website database scope</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TREATMENT FEE CARDS GRID (EXACTLY MATCHING IMAGE 1)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTreatments.length === 0 ? (
          <div className="col-span-full bg-white border border-[#E5E5E5] rounded-xl p-12 text-center text-[#737373]">
            <DollarSign size={28} className="mx-auto mb-2 text-[#A3A3A3]" />
            <p className="font-semibold text-black">No treatments match your search</p>
            <p className="text-xs text-[#737373] mt-1">Try another keyword.</p>
          </div>
        ) : (
          filteredTreatments.map(t => {
            const options = Array.isArray(t.options) ? t.options : [];

            return (
              <div 
                key={t.id} 
                className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-2xs hover:border-[#D4D4D4] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h4 className="font-semibold text-black text-sm uppercase">
                      {t.title}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] capitalize shrink-0">
                      {t.category || 'Package'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                        <tr>
                          <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                            Duration
                          </th>
                          <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#737373] text-right">
                            Fee (IDR)
                          </th>
                          <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#737373] text-right w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
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
                            <tr key={durationStr} className="hover:bg-[#FAFAFA] transition-colors">
                              <td className="py-2.5 px-3 font-medium text-black">
                                {durationStr} mins
                              </td>

                              <td className="py-2.5 px-3 font-semibold text-black text-right">
                                {isEditing ? (
                                  <input 
                                    type="text"
                                    autoFocus
                                    placeholder="e.g. 150,000"
                                    value={feeInputs[key] || ''}
                                    onChange={e => setFeeInputs({ ...feeInputs, [key]: e.target.value })}
                                    className="h-7 text-xs text-right py-0.5 px-2 w-24 border border-[#E5E5E5] rounded bg-white text-black focus:outline-none focus:border-black inline-block font-mono"
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
                                        className="h-6 px-2 text-[11px] font-medium rounded bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        {isSaving ? <RefreshCw size={10} className="animate-spin text-[#facc15]" /> : <Check size={11} />}
                                        <span>Save</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingFee(null)}
                                        className="h-6 px-1.5 text-[11px] font-medium rounded border border-[#E5E5E5] bg-white text-[#737373] hover:text-black hover:bg-[#F5F5F5] transition-colors cursor-pointer"
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
                                        className="p-1 rounded text-[#737373] hover:text-black hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                                        title={feeObj ? 'Edit Fee' : 'Add Fee'}
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      {feeObj && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFee(t.id, durationStr)}
                                          className="p-1 rounded text-[#737373] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                          title="Delete Fee"
                                        >
                                          <Trash2 size={13} className="text-rose-500" />
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
