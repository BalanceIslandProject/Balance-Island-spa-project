'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
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
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12">
      
      {/* Top App Header / Back Bar */}
      <div className="flex items-center justify-between pt-1">
        <Link 
          href="/partners/dashboard" 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-2xs text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={13} />
          <span>Dashboard</span>
        </Link>

        {/* Mobile Header Quick Log Out */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50/80 border border-red-200/60 text-xs font-bold text-red-600 active:scale-95 transition-all"
        >
          <LogOut size={12} />
          <span>{loggingOut ? 'Signing out...' : 'Log Out'}</span>
        </button>
      </div>

      {/* Hero Profile Identity Card (Native App Style) */}
      <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-neutral-200/40 via-sky-100/20 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

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
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-sm ring-4 ring-neutral-100/80 cursor-pointer overflow-hidden group relative transition-transform active:scale-95"
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
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
              </div>
            </div>

            {/* Partner Details */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight truncate">
                  {formData.first_name || 'Partner'} {formData.last_name || ''}
                </h1>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {partner?.status || 'Active'}
                </span>
              </div>

              {/* Company / Business Name */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate font-medium">
                <Building2 size={13} className="text-neutral-400 shrink-0" />
                <span className="truncate">{formData.business_name || 'Hospitality Partner'}</span>
              </div>

              {/* Commission Rate (Directly BELOW Company Name) */}
              <div className="pt-0.5 pb-0.5">
                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-neutral-900 bg-neutral-100/90 px-2.5 py-0.5 rounded-md border border-neutral-200/80 uppercase tracking-wider">
                  {partner?.commission_rate_pct || 10}% Commission
                </span>
              </div>

              <div className="text-[11px] text-neutral-400 font-mono truncate">
                {partner?.email}
              </div>

              {/* Photo Upload Controls (Clean & Professional) */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-950 hover:underline cursor-pointer transition-colors"
                >
                  <Camera size={12} className="text-neutral-400" />
                  <span>{localAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                {localAvatar && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer transition-colors"
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
        <div className="mt-4 pt-4 border-t border-neutral-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
            <span>Referral Link</span>
            <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-bold uppercase">30-Day Cookie</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200/80 text-xs font-mono text-neutral-800 transition-all active:scale-98 cursor-pointer"
          >
            <span className="truncate">?ref={partner?.partner_code}</span>
            {copiedLink ? (
              <span className="text-[10px] font-sans font-bold text-emerald-600 flex items-center gap-1">
                <Check size={12} /> Copied!
              </span>
            ) : (
              <span className="text-[10px] font-sans font-semibold text-neutral-400 flex items-center gap-1">
                <Copy size={12} /> Copy Full Link
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 shadow-2xs animate-in fade-in-50 duration-200 ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border-red-200 bg-red-50 text-red-950'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        
        {/* Section 1: Contact Information */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-2.5 border-b border-neutral-100 pb-3">
            <User size={18} className="text-neutral-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-neutral-950 uppercase tracking-wider">
                Contact Information
              </h2>
              <p className="text-[11px] text-neutral-400">
                Your identity and primary hospitality business details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-neutral-400" />
              Villa, Hotel, or Business Name
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Villa Mandala Ubud or Luxury Tours Bali"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
            />
          </div>

          {/* WhatsApp ONLY (Phone Removed, Neutral Icon Color) */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageCircle size={13} className="text-neutral-400" />
              WhatsApp Number
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+62 812 3456 7890"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Used for guest booking notifications & partner support. Include country code (e.g. +62).
            </p>
          </div>
        </div>

        {/* Section 2: Bank Transfer Payout Destination (Clean Fintech Styling without Clunky Circle Card) */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-2.5 border-b border-neutral-100 pb-3">
            <Landmark size={18} className="text-neutral-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-neutral-950 uppercase tracking-wider">
                Bank Transfer Payout Destination
              </h2>
              <p className="text-[11px] text-neutral-400">
                Where you receive your weekly or monthly partner commissions via direct Indonesian bank transfer
              </p>
            </div>
          </div>

          <div className="space-y-3.5 p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/70">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Landmark size={14} />
                  </div>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="BCA, Mandiri, BNI, BRI, etc."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                  />
                </div>
                {/* One-Tap Indonesian Bank Quick Selectors */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {['BCA', 'Mandiri', 'BNI', 'BRI'].map((bank) => (
                    <button
                      type="button"
                      key={bank}
                      onClick={() => setFormData((prev) => ({ ...prev, bank_name: bank }))}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        formData.bank_name?.toUpperCase() === bank
                          ? 'bg-neutral-950 text-white shadow-2xs'
                          : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:border-neutral-300'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-mono font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Account Holder Full Name
              </label>
              <input
                type="text"
                name="account_holder"
                value={formData.account_holder}
                onChange={handleChange}
                placeholder="Exact name registered in your bank account"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Primary Action */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer flex items-center justify-center gap-2"
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
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <ShieldCheck size={16} className="text-neutral-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Account Security & Actions
          </h2>
        </div>

        <div className="space-y-3">
          {/* Dedicated WhatsApp Partner Concierge (External click icon removed as requested) */}
          <a
            href="https://wa.me/6285174119423"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 text-xs font-semibold text-neutral-800 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 w-full">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <MessageCircle size={15} />
              </div>
              <div className="text-left">
                <span className="font-bold text-neutral-950 block">WhatsApp Partner Support</span>
                <span className="text-[11px] text-neutral-500">Need help updating bank info or tracking?</span>
              </div>
            </div>
          </a>

          {/* Prominent Red Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100/90 active:scale-[0.98] text-red-600 font-bold text-xs tracking-wider uppercase border border-red-200/80 transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
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
          <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
            <Lock size={10} className="text-neutral-400" />
            <span>End-to-end encrypted session • partners.booktherapick.com</span>
          </p>
        </div>
      </div>

    </div>
  );
}
