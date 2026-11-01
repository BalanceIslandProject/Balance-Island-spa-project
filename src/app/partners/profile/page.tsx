'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Copy, 
  Check, 
  Download, 
  QrCode, 
  X, 
  Landmark, 
  ShieldCheck, 
  Phone,
  Building,
  CheckCircle2
} from 'lucide-react';

export default function PartnerSettingsPage() {
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    whatsapp: '',
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/affiliates/auth/me');
        const data = await res.json();
        if (data.success && data.partner) {
          const p = data.partner;
          setPartner(p);
          setFormData({
            first_name: p.first_name || '',
            last_name: p.last_name || '',
            business_name: p.business_name || '',
            whatsapp: p.whatsapp || p.phone || '',
            bank_name: p.payout_details?.bank_name || 'BCA',
            account_number: p.payout_details?.account_number || '',
            account_holder: p.payout_details?.account_holder || '',
          });
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const partnerCode = partner?.partner_code || 'MIKODRIV721';
  const partnerName = partner?.first_name 
    ? `${partner.first_name} ${partner.last_name || ''}`.trim() 
    : 'Miko Arta';
  const commissionRate = partner?.commission_rate_pct || 15;
  const referralLink = `https://www.booktherapick.com/ref=${partnerCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}`;

  const partnerInitials = partner?.first_name 
    ? `${partner.first_name[0] || 'M'}${partner.last_name?.[0] || 'A'}`.toUpperCase()
    : 'MA';

  const formatJoinedDate = (createdStr?: string) => {
    if (!createdStr) return 'Joined 25 Oct 2026';
    try {
      const d = new Date(createdStr);
      return `Joined ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Joined 25 Oct 2026';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partnerCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQR = async () => {
    setDownloadingQr(true);
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `therapick-qr-${partnerCode}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(qrCodeUrl, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/affiliates/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          whatsapp: formData.whatsapp,
          phone: formData.whatsapp,
          payout_details: {
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            account_holder: formData.account_holder,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPartner((prev: any) => ({
          ...prev,
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          whatsapp: formData.whatsapp,
          phone: formData.whatsapp,
          payout_details: {
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            account_holder: formData.account_holder,
          },
        }));
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowEditModal(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* 1. HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0f172a] tracking-tight">
          Settings / Profile
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Manage your profile and referral link.
        </p>
      </div>

      {/* 2. THREE CARDS (Partner Profile, Referral Link & Code, QR Code) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* CARD 1: PARTNER PROFILE */}
        <div className="col-span-1 md:col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">
            Partner Profile
          </h2>

          <div className="flex items-start gap-3.5">
            {/* Avatar Circle */}
            <div className="w-13 h-13 rounded-full bg-[#0f172a] text-white font-bold text-base flex items-center justify-center shrink-0">
              {partnerInitials}
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-[#0f172a] truncate">
                  {partnerName}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-[10px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Active
                </span>
              </div>

              <div className="font-mono text-xs text-[#64748b]">
                {partnerCode}
              </div>

              <div className="text-xs text-[#64748b] pt-0.5">
                {commissionRate}% commission • {formatJoinedDate(partner?.created_at)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="w-full py-2 px-3 text-xs font-medium text-[#0f172a] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-[8px] transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* CARD 2: REFERRAL LINK & CODE */}
        <div className="col-span-1 md:col-span-7 lg:col-span-5 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">
            Referral Link & Code
          </h2>

          {/* Referral Link Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748b] block">
              Referral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2 text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-[#0f172a] font-mono truncate focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-[8px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Partner Code Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748b] block">
              Partner Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={partnerCode}
                className="flex-1 px-3 py-2 text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-[#0f172a] font-mono tracking-wider truncate focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2 rounded-[8px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#94a3b8] leading-relaxed pt-1 border-t border-[#f1f5f9]">
            Guests who visit with your link or code get 30-day referral attribution.
          </p>
        </div>

        {/* CARD 3: QR CODE */}
        <div className="col-span-1 md:col-span-5 lg:col-span-3 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4 flex flex-col items-center text-center">
          <h2 className="text-sm font-semibold text-[#0f172a] self-start">
            QR Code
          </h2>

          <div className="p-3 bg-white border border-[#e2e8f0] rounded-[10px] shadow-xs">
            <img
              src={qrCodeUrl}
              alt={`Therapick Partner QR - ${partnerCode}`}
              className="w-32 h-32 object-contain"
            />
          </div>

          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={downloadingQr}
            className="w-full py-2 px-3 rounded-[8px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download size={13} />
            <span>{downloadingQr ? 'Downloading...' : 'Download QR'}</span>
          </button>
        </div>

      </div>

      {/* ========================================================
          MODAL: EDIT PARTNER PROFILE
         ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-xl border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#0f172a]" />
                <h3 className="font-semibold text-sm text-[#0f172a]">Edit Partner Profile</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#475569] block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#475569] block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">Business Name / Villa</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="e.g. Villa Sanctuary Ubud"
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                />
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">WhatsApp / Phone</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a] font-mono"
                />
              </div>

              <div className="pt-2 border-t border-[#f1f5f9] space-y-3">
                <span className="font-semibold text-[#0f172a] block">Bank Account for Payouts</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-[#475569] block mb-1">Bank</label>
                    <select
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                    >
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Permata">Bank Permata</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-[#475569] block mb-1">Account Number</label>
                    <input
                      type="text"
                      required
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-[#475569] block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-[6px] bg-[#f0fdf4] text-[#15803d] text-xs flex items-center gap-1.5 border border-[#bbf7d0]">
                  <Check size={14} /> Profile updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] rounded-[6px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 text-xs font-medium bg-[#0f172a] text-white rounded-[6px] hover:bg-[#1e293b] disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
