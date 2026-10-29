'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Copy,
  Check,
  MessageCircle,
  Lock,
  Landmark,
  Camera,
  Trash2
} from 'lucide-react';

const AVATAR_STORAGE_KEY = 'partner_profile_avatar_local';

export default function PartnerProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [partner, setPartner] = useState<any>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

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
    // 1. Load custom profile photo from device storage (never sent to database)
    try {
      const savedPhoto = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedPhoto) {
        setLocalAvatar(savedPhoto);
      }
    } catch (e) {
      console.error('Error loading avatar from local storage:', e);
    }

    // 2. Load partner profile from server
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Create an optimized thumbnail canvas to keep device storage fast & lightweight
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            try {
              localStorage.setItem(AVATAR_STORAGE_KEY, compressed);
              setLocalAvatar(compressed);
            } catch (storageErr) {
              console.error('Failed to save to localStorage:', storageErr);
              try {
                localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
                setLocalAvatar(dataUrl);
              } catch (fallbackErr) {
                alert('Local device storage is full. Could not save photo.');
              }
            }
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
      setLocalAvatar(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error removing local avatar:', err);
    }
  };

  const handleCopyLink = () => {
    if (!partner?.partner_code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.booktherapick.com';
    const mainOrigin = origin.includes('partners.') 
      ? origin.replace('partners.', 'www.') 
      : 'https://www.booktherapick.com';
    const link = `${mainOrigin}/?ref=${partner.partner_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/affiliates/auth/logout', { method: 'POST' });
      router.push('/partners/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const payout_details = {
        bank_name: formData.bank_name || 'BCA',
        account_number: formData.account_number,
        account_holder: formData.account_holder,
      };

      const res = await fetch('/api/affiliates/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          phone: formData.whatsapp, // Synchronize for database constraint integrity
          whatsapp: formData.whatsapp,
          payout_method: 'bank_transfer',
          payout_details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to save changes.' });
      } else {
        setStatusMsg({ type: 'success', text: 'Profile updated successfully.' });
        setPartner(data.partner);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-neutral-500 font-medium">Loading partner profile...</div>
      </div>
    );
  }

  const initials = `${formData.first_name?.[0] || partner?.first_name?.[0] || 'P'}${formData.last_name?.[0] || partner?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-12 font-sans">
      {/* Hero Profile Identity Card */}
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 sm:p-6 relative overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        {/* Hidden device-local file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
          aria-label="Upload profile photo"
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            
            {/* Avatar (Click to upload photo to device) */}
            <div className="relative shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-[6px] bg-[#171717] text-white font-bold text-xl sm:text-2xl flex items-center justify-center border border-[#ebebeb] cursor-pointer overflow-hidden group relative transition-transform"
                title="Tap to change profile photo"
              >
                {localAvatar ? (
                  <img
                    src={localAvatar}
                    alt="Partner profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials || 'P'}</span>
                )}

                {/* Subtle camera overlay on hover/tap */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={18} />
                </div>
              </div>
            </div>

            {/* Partner Details */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight truncate">
                  {formData.first_name || 'Partner'} {formData.last_name || ''}
                </h1>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20 uppercase tracking-[0.071em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a] animate-pulse" />
                  {partner?.status || 'Active'}
                </span>
              </div>

              {/* Company / Business Name */}
              <div className="flex items-center gap-1.5 text-xs text-[#666666] truncate font-medium">
                <Building2 size={13} className="text-[#666666] shrink-0" />
                <span className="truncate">{formData.business_name || 'Hospitality Partner'}</span>
              </div>

              {/* Commission Rate */}
              <div className="pt-0.5 pb-0.5">
                <span className="inline-flex items-center font-mono text-[10px] sm:text-[11px] font-medium text-[#171717] bg-[#fafafa] px-2.5 py-0.5 rounded-[4px] border border-[#ebebeb] uppercase tracking-[0.071em]">
                  {partner?.commission_rate_pct || 10}% Commission
                </span>
              </div>

              <div className="text-xs text-[#666666] font-mono truncate">
                {partner?.email}
              </div>

              {/* Photo Upload Controls */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#171717] hover:underline cursor-pointer transition-colors"
                >
                  <Camera size={12} className="text-[#666666]" />
                  <span>{localAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                {localAvatar && (
                  <>
                    <span className="text-[#ebebeb]">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer transition-colors"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* One-Tap Referral Link Bar */}
        <div className="mt-4 pt-4 border-t border-[#ebebeb] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#666666]">
            <span>Referral Link</span>
            <span className="font-mono text-[10px] text-[#297a3a] bg-[#297a3a]/10 px-1.5 py-0.5 rounded-[4px] border border-[#297a3a]/20 font-medium uppercase tracking-[0.071em]">Per-Booking</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-[6px] bg-[#fafafa] hover:bg-[#ebebeb] border border-[#ebebeb] text-xs font-mono text-[#171717] transition-all cursor-pointer"
          >
            <span className="truncate">?ref={partner?.partner_code}</span>
            {copiedLink ? (
              <span className="font-mono text-[10px] font-medium text-[#297a3a] flex items-center gap-1">
                <Check size={12} /> Copied!
              </span>
            ) : (
              <span className="font-mono text-[10px] font-medium text-[#666666] flex items-center gap-1">
                <Copy size={12} /> Copy Full Link
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={`p-4 rounded-[6px] border text-xs flex items-center gap-3 animate-in fade-in-50 duration-200 ${
            statusMsg.type === 'success'
              ? 'border-[#297a3a]/20 bg-[#297a3a]/10 text-[#297a3a]'
              : 'border-red-200 bg-red-50 text-red-950'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-[#297a3a] shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Section 1: Contact Information */}
        <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 sm:p-6 space-y-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-2.5 border-b border-[#ebebeb] pb-3">
            <User size={18} className="text-[#171717] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-mono text-xs sm:text-sm font-medium text-[#171717] uppercase tracking-[0.071em]">
                Contact Information
              </h2>
              <p className="text-xs text-[#666666]">
                Your identity and primary hospitality business details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-[#666666]" />
              Villa, Hotel, or Business Name
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Villa Mandala Ubud or Luxury Tours Bali"
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
            />
          </div>

          {/* WhatsApp ONLY */}
          <div>
            <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5 flex items-center gap-1.5">
              <MessageCircle size={13} className="text-[#666666]" />
              WhatsApp Number
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+62 812 3456 7890"
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
            />
            <p className="text-xs text-[#666666] mt-1">
              Used for guest booking notifications & partner support. Include country code (e.g. +62).
            </p>
          </div>
        </div>

        {/* Section 2: Bank Transfer Payout Destination */}
        <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 sm:p-6 space-y-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-2.5 border-b border-[#ebebeb] pb-3">
            <Landmark size={18} className="text-[#171717] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-mono text-xs sm:text-sm font-medium text-[#171717] uppercase tracking-[0.071em]">
                Bank Transfer Payout Destination
              </h2>
              <p className="text-xs text-[#666666]">
                Where you receive your weekly or monthly partner commissions via direct Indonesian bank transfer
              </p>
            </div>
          </div>

          <div className="space-y-3.5 p-4 rounded-[6px] bg-[#fafafa] border border-[#ebebeb]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5">
                  Bank Name
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none">
                    <Landmark size={14} />
                  </div>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="BCA, Mandiri, BNI, BRI, etc."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-semibold text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
                  />
                </div>
                {/* One-Tap Indonesian Bank Quick Selectors */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {['BCA', 'Mandiri', 'BNI', 'BRI'].map((bank) => (
                    <button
                      type="button"
                      key={bank}
                      onClick={() => setFormData((prev) => ({ ...prev, bank_name: bank }))}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                        formData.bank_name?.toUpperCase() === bank
                          ? 'bg-[#171717] text-white border-[#171717]'
                          : 'bg-white border-[#ebebeb] text-[#666666] hover:text-[#171717] hover:border-[#171717]'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-mono font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1.5">
                Account Holder Full Name
              </label>
              <input
                type="text"
                name="account_holder"
                value={formData.account_holder}
                onChange={handleChange}
                placeholder="Exact name registered in your bank account"
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Primary Action */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-[6px] bg-[#171717] hover:bg-[#262626] text-white font-mono font-medium text-xs tracking-[0.071em] uppercase transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile Changes...</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </div>
      </form>

      {/* Section 3: App Actions & Security */}
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 sm:p-6 space-y-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-3">
          <ShieldCheck size={16} className="text-[#666666]" />
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.071em] text-[#171717]">
            Account Security & Actions
          </h2>
        </div>

        <div className="space-y-3">
          {/* Dedicated WhatsApp Partner Concierge */}
          <a
            href="https://wa.me/6285174119423"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center p-3.5 rounded-[6px] bg-[#fafafa] hover:bg-[#ebebeb] border border-[#ebebeb] text-xs font-semibold text-[#171717] transition-colors"
          >
            <div className="flex items-center gap-2.5 w-full">
              <div className="w-8 h-8 rounded-[6px] bg-[#fafafa] text-[#171717] flex items-center justify-center shrink-0 border border-[#ebebeb]">
                <MessageCircle size={15} />
              </div>
              <div className="text-left">
                <span className="font-semibold text-[#171717] block">WhatsApp Partner Support</span>
                <span className="text-xs text-[#666666]">Need help updating bank info or tracking?</span>
              </div>
            </div>
          </a>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-3 px-4 rounded-[6px] bg-red-50 hover:bg-red-100 text-red-600 font-mono font-medium text-xs tracking-[0.071em] uppercase border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Signing out of portal...</span>
              </>
            ) : (
              <>
                <LogOut size={15} strokeWidth={2.2} />
                <span>Sign Out of Partner Account</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="font-mono text-xs text-[#666666] flex items-center justify-center gap-1.5">
            <Lock size={12} className="text-[#666666]" />
            <span>End-to-end encrypted session • partners.booktherapick.com</span>
          </p>
        </div>
      </div>

    </div>
  );
}
