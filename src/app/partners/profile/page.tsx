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
  Trash2,
  Share2,
  KeyRound,
  ExternalLink
} from 'lucide-react';

const AVATAR_STORAGE_KEY = 'partner_profile_avatar_local';

export default function PartnerProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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
    try {
      const savedPhoto = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedPhoto) {
        setLocalAvatar(savedPhoto);
      }
    } catch (e) {
      console.error('Error loading avatar from local storage:', e);
    }

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

  const handleCopyCode = () => {
    if (!partner?.partner_code) return;
    navigator.clipboard.writeText(partner.partner_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
          phone: formData.whatsapp,
          whatsapp: formData.whatsapp,
          payout_method: 'bank_transfer',
          payout_details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to save changes.' });
      } else {
        setStatusMsg({ type: 'success', text: 'Partner profile updated successfully.' });
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
        <div className="w-6 h-6 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-[#6b7280] font-mono">Loading partner profile...</div>
      </div>
    );
  }

  const initials = `${formData.first_name?.[0] || partner?.first_name?.[0] || 'P'}${formData.last_name?.[0] || partner?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-12 font-sans">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
          Partner Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
          Manage your partner profile, Indonesian bank transfer destination, and account security.
        </p>
      </div>

      {/* Hero Profile Identity Card */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 sm:p-6 shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
          aria-label="Upload profile photo"
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            
            {/* Avatar */}
            <div className="relative shrink-0">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#111827] text-white font-bold text-lg sm:text-2xl flex items-center justify-center border border-[#e5e7eb] cursor-pointer overflow-hidden group relative transition-transform"
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

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={16} />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#111827] tracking-tight truncate">
                  {formData.first_name || 'Partner'} {formData.last_name || ''}
                </h2>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                  {partner?.status || 'Active'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#6b7280] truncate font-medium">
                <Building2 size={13} className="text-[#9ca3af] shrink-0" />
                <span className="truncate">{formData.business_name || 'Hospitality Partner'}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-[#6b7280] font-mono">
                <span className="text-[#111827] bg-[#f3f4f6] px-2 py-0.5 rounded-[4px] font-semibold">
                  {partner?.commission_rate_pct || 10}% Commission
                </span>
                <span>•</span>
                <span className="truncate">{partner?.email}</span>
              </div>

              <div className="pt-1 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-[#111827] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Camera size={11} className="text-[#6b7280]" />
                  <span>{localAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                {localAvatar && (
                  <>
                    <span className="text-[#e5e7eb]">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="font-medium text-red-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Partner Code */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#e5e7eb]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
              Partner Code
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-[#111827] bg-[#f9fafb] px-2.5 py-1 rounded-[6px] border border-[#e5e7eb]">
                {partner?.partner_code || '...'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-[6px] bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] text-[#111827] cursor-pointer"
                title="Copy partner code"
              >
                {copiedCode ? <Check size={12} className="text-[#16a34a]" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Link Row */}
        <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
            <Share2 size={13} />
            <span>Referral Attribution Link:</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-[6px] bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] text-xs font-mono text-[#111827] transition-all cursor-pointer"
          >
            <span className="truncate">?ref={partner?.partner_code}</span>
            {copiedLink ? (
              <span className="font-mono text-[10px] font-semibold text-[#16a34a] flex items-center gap-1">
                <Check size={12} /> Copied
              </span>
            ) : (
              <span className="font-mono text-[10px] font-medium text-[#6b7280] flex items-center gap-1">
                <Copy size={12} /> Copy Full Link
              </span>
            )}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-[8px] border text-xs flex items-center gap-2.5 animate-in fade-in-50 ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-950'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={15} className="text-[#16a34a] shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Section 1: Contact Information */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-start gap-2.5 border-b border-[#e5e7eb] pb-3">
            <User size={18} className="text-[#111827] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">
                Contact & Business Information
              </h3>
              <p className="text-xs text-[#6b7280]">
                Your identity and registered partner details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-medium text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-medium text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Villa, Hotel, or Business Name</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Villa Mandala Ubud"
              className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-medium text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">WhatsApp Number</label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+62 812 3456 7890"
              className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-medium text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
            />
            <p className="text-[11px] text-[#6b7280] mt-1">
              Used for automated guest booking alerts and finance settlements. Include country code (+62).
            </p>
          </div>
        </div>

        {/* Section 2: Bank Transfer Payout Destination */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-start gap-2.5 border-b border-[#e5e7eb] pb-3">
            <Landmark size={18} className="text-[#111827] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">
                Bank Transfer Payout Destination
              </h3>
              <p className="text-xs text-[#6b7280]">
                Where you receive your weekly or on-demand affiliate earnings via direct bank transfer
              </p>
            </div>
          </div>

          <div className="space-y-3.5 p-4 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Bank Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="BCA, Mandiri, BNI, BRI, etc."
                    className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {['BCA', 'Mandiri', 'BNI', 'BRI'].map((bank) => (
                    <button
                      type="button"
                      key={bank}
                      onClick={() => setFormData((prev) => ({ ...prev, bank_name: bank }))}
                      className={`px-2.5 py-0.5 rounded-[4px] text-xs font-mono transition-all cursor-pointer border ${
                        formData.bank_name?.toUpperCase() === bank
                          ? 'bg-[#111827] text-white border-[#111827] font-semibold'
                          : 'bg-white border-[#e5e7eb] text-[#6b7280] hover:text-[#111827]'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-mono font-medium text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Account Holder Full Name</label>
              <input
                type="text"
                name="account_holder"
                value={formData.account_holder}
                onChange={handleChange}
                placeholder="Exact name registered on your bank passbook / mobile app"
                className="w-full px-3 py-2 rounded-[6px] border border-[#e5e7eb] text-xs font-medium text-[#111827] bg-white focus:outline-none focus:border-[#111827]"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-[8px] bg-[#111827] hover:bg-black text-white font-mono font-medium text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile Changes...</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </div>
      </form>

      {/* Section 3: Account Security & Support Actions */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-3">
          <ShieldCheck size={16} className="text-[#111827]" />
          <h3 className="text-sm font-semibold text-[#111827]">Account Security & Support</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://wa.me/6285174119423"
            target="_blank"
            rel="noreferrer"
            className="flex items-center p-3.5 rounded-[8px] bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] text-xs font-medium text-[#111827] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-white text-[#111827] flex items-center justify-center shrink-0 border border-[#e5e7eb]">
                <MessageCircle size={15} />
              </div>
              <div>
                <span className="font-semibold text-[#111827] block">WhatsApp Partner Support</span>
                <span className="text-[11px] text-[#6b7280]">Assistance with payouts & tracking</span>
              </div>
            </div>
          </a>

          <div className="flex items-center p-3.5 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] text-xs font-medium text-[#111827]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-white text-[#111827] flex items-center justify-center shrink-0 border border-[#e5e7eb]">
                <KeyRound size={15} />
              </div>
              <div>
                <span className="font-semibold text-[#111827] block">Password & Credentials</span>
                <span className="text-[11px] text-[#6b7280]">Managed via secure partner concierge</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2.5 px-4 rounded-[8px] bg-red-50 hover:bg-red-100 text-red-600 font-mono font-semibold text-xs tracking-wider uppercase border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loggingOut ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Signing out of portal...</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>Sign Out of Partner Account</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
