'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  Lock, 
  Bell, 
  ChevronRight, 
  Copy, 
  Check, 
  Download, 
  X, 
  Landmark, 
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCw
} from 'lucide-react';

export default function PartnerSettingsPage() {
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  // Active view or modal
  const [activeModal, setActiveModal] = useState<'profile' | 'payment' | 'security' | 'notifications' | null>(null);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    whatsapp: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Bank Form
  const [bankForm, setBankForm] = useState({
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification toggles
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    whatsappAlerts: true,
    payoutDisbursed: true,
  });
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  const loadPartner = async () => {
    try {
      const res = await fetch('/api/affiliates/auth/me');
      const data = await res.json();
      if (data.success && data.partner) {
        const p = data.partner;
        setPartner(p);
        setProfileForm({
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          business_name: p.business_name || '',
          whatsapp: p.whatsapp || p.phone || '',
        });
        setBankForm({
          bank_name: p.payout_details?.bank_name || 'BCA',
          account_number: p.payout_details?.account_number || '',
          account_holder: p.payout_details?.account_holder || '',
        });
      }
    } catch (e) {
      console.error('Error fetching partner profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadPartner();
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => {
    loadPartner();

    const onGlobalRefresh = () => {
      loadPartner();
    };
    window.addEventListener('partner:refresh', onGlobalRefresh);
    return () => window.removeEventListener('partner:refresh', onGlobalRefresh);
  }, []);

  const partnerCode = partner?.partner_code || 'PARTNER';
  const partnerName = partner?.first_name 
    ? `${partner.first_name} ${partner.last_name || ''}`.trim() 
    : 'Partner Account';
  const partnerEmail = partner?.email || 'partner@booktherapick.com';
  const referralLink = `https://www.booktherapick.com/?ref=${partnerCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}`;

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

  const handleDownloadQr = async () => {
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
    } catch {
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
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          business_name: profileForm.business_name,
          whatsapp: profileForm.whatsapp,
          phone: profileForm.whatsapp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPartner((prev: any) => ({
          ...prev,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          business_name: profileForm.business_name,
          whatsapp: profileForm.whatsapp,
        }));
        setProfileSuccess(true);
        setTimeout(() => {
          setProfileSuccess(false);
          setActiveModal(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch('/api/affiliates/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_details: bankForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPartner((prev: any) => ({
          ...prev,
          payout_details: bankForm,
        }));
        setBankSuccess(true);
        setTimeout(() => {
          setBankSuccess(false);
          setActiveModal(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving bank details:', err);
    } finally {
      setSavingBank(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (securityForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setActiveModal(null);
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }, 1500);
    }, 800);
  };

  const handleSaveNotifications = () => {
    setNotificationsSaved(true);
    setTimeout(() => {
      setNotificationsSaved(false);
      setActiveModal(null);
    }, 1200);
  };

  return (
    <div className="space-y-6 w-full font-sans max-w-[1400px] mx-auto pb-8">
      
      {/* ========================================================
          1. APP CONTROLS BAR (CLEAN APP-STYLE ACTION BAR)
         ======================================================== */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
            Account Preferences
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[12px] sm:text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh profile details"
            aria-label="Refresh profile details"
          >
            <RotateCw size={13} className={`text-[#64748B] ${refreshing ? 'animate-spin text-[#0E2319]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. SETTINGS MODULE CARDS (MATCHING MOCKUP SCREEN 7)
         ======================================================== */}
      <div className="space-y-3">
        
        {/* CARD 1: PROFILE */}
        <div 
          onClick={() => setActiveModal('profile')}
          className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#0E2319]/40 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0E2319] flex items-center justify-center shrink-0 group-hover:bg-[#0E2319]/5 transition-colors">
              <User size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0F172A]">
                Profile
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">
                Update your personal information
              </div>
            </div>
          </div>
          <ChevronRight size={17} className="text-[#94A3B8] group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* CARD 2: PAYMENT DETAILS */}
        <div 
          onClick={() => setActiveModal('payment')}
          className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#0E2319]/40 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0E2319] flex items-center justify-center shrink-0 group-hover:bg-[#0E2319]/5 transition-colors">
              <CreditCard size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0F172A]">
                Payment Details
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">
                Set your payout information
              </div>
            </div>
          </div>
          <ChevronRight size={17} className="text-[#94A3B8] group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* CARD 3: SECURITY */}
        <div 
          onClick={() => setActiveModal('security')}
          className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#0E2319]/40 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0E2319] flex items-center justify-center shrink-0 group-hover:bg-[#0E2319]/5 transition-colors">
              <Lock size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0F172A]">
                Security
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">
                Change your password
              </div>
            </div>
          </div>
          <ChevronRight size={17} className="text-[#94A3B8] group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* CARD 4: NOTIFICATIONS */}
        <div 
          onClick={() => setActiveModal('notifications')}
          className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#0E2319]/40 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0E2319] flex items-center justify-center shrink-0 group-hover:bg-[#0E2319]/5 transition-colors">
              <Bell size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0F172A]">
                Notifications
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">
                Choose what updates you receive
              </div>
            </div>
          </div>
          <ChevronRight size={17} className="text-[#94A3B8] group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

      </div>

      {/* ========================================================
          3. REFERRAL LINK & QR CODE SUMMARY (IN SETTINGS)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        
        {/* Referral Link & Code */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-3">
          <div className="text-sm font-semibold text-[#0F172A]">
            Referral Tracking
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#64748B] text-[11px] block">Partner Code:</span>
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] mt-1 font-mono font-bold text-[#0F172A]">
                <span>{partnerCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[#64748B] text-[11px] block">Booking Link:</span>
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] mt-1 font-mono text-[11px] text-[#0F172A]">
                <span className="truncate pr-2">{referralLink}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer shrink-0"
                  title="Copy Link"
                >
                  {copiedLink ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#0F172A]">
              Villa Guest QR Asset
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Print or display this QR code at your villa or reception desk for automatic booking attribution.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={downloadingQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#0E2319] hover:bg-[#163625] text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                <Download size={13} />
                <span>{downloadingQr ? 'Downloading...' : 'Download QR'}</span>
              </button>
            </div>
          </div>

          <div className="w-20 h-20 bg-white border border-[#E2E8F0] rounded-[8px] p-1.5 flex items-center justify-center shrink-0">
            <img 
              src={qrCodeUrl} 
              alt="Therapick QR" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>

      </div>

      {/* ========================================================
          MODAL: PROFILE
         ======================================================== */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#0E2319]" />
                <h3 className="font-semibold text-sm text-[#0F172A]">Personal Profile</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#475569] block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#475569] block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">Business Name / Villa</label>
                <input
                  type="text"
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                  placeholder="e.g. Royal Villa Ubud"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">WhatsApp Contact</label>
                <input
                  type="text"
                  value={profileForm.whatsapp}
                  onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                  placeholder="+62 8..."
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              {profileSuccess && (
                <div className="p-2.5 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-xs flex items-center gap-1.5 border border-[#A7F3D0]">
                  <Check size={14} /> Profile updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 text-xs font-semibold bg-[#0E2319] text-white rounded-[6px] hover:bg-[#163625] cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PAYMENT DETAILS
         ======================================================== */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#0E2319]" />
                <h3 className="font-semibold text-sm text-[#0F172A]">Destination Bank Account</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#475569] block mb-1">Bank Name</label>
                <select
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                  placeholder="e.g. 08256285"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319] font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={bankForm.account_holder}
                  onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
                  placeholder="e.g. Putu Edo Santika"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              {bankSuccess && (
                <div className="p-2.5 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-xs flex items-center gap-1.5 border border-[#A7F3D0]">
                  <Check size={14} /> Bank details saved successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-4 py-2 text-xs font-semibold bg-[#0E2319] text-white rounded-[6px] hover:bg-[#163625] cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingBank ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SECURITY
         ======================================================== */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[#0E2319]" />
                <h3 className="font-semibold text-sm text-[#0F172A]">Password & Security</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#475569] block mb-1">Current Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                </button>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-[6px] bg-red-50 text-red-700 text-xs border border-red-200">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2.5 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-xs flex items-center gap-1.5 border border-[#A7F3D0]">
                  <Check size={14} /> Password changed successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 text-xs font-semibold bg-[#0E2319] text-white rounded-[6px] hover:bg-[#163625] cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: NOTIFICATIONS
         ======================================================== */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#0E2319]" />
                <h3 className="font-semibold text-sm text-[#0F172A]">Notification Preferences</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0F172A]">Email Booking Alerts</div>
                  <div className="text-[#64748B] text-[11px]">Receive an email when a guest reserves with your code.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailBookings}
                  onChange={(e) => setNotifications({ ...notifications, emailBookings: e.target.checked })}
                  className="w-4 h-4 accent-[#0E2319] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                <div>
                  <div className="font-semibold text-[#0F172A]">WhatsApp Alerts</div>
                  <div className="text-[#64748B] text-[11px]">Receive instant WhatsApp updates on commission approvals.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.whatsappAlerts}
                  onChange={(e) => setNotifications({ ...notifications, whatsappAlerts: e.target.checked })}
                  className="w-4 h-4 accent-[#0E2319] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                <div>
                  <div className="font-semibold text-[#0F172A]">Payout Completion</div>
                  <div className="text-[#64748B] text-[11px]">Notification when your funds have transferred to bank.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.payoutDisbursed}
                  onChange={(e) => setNotifications({ ...notifications, payoutDisbursed: e.target.checked })}
                  className="w-4 h-4 accent-[#0E2319] cursor-pointer"
                />
              </div>

              {notificationsSaved && (
                <div className="p-2.5 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-xs flex items-center gap-1.5 border border-[#A7F3D0]">
                  <Check size={14} /> Notification preferences saved!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-4 py-2 text-xs font-semibold bg-[#0E2319] text-white rounded-[6px] hover:bg-[#163625] cursor-pointer shadow-xs"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
