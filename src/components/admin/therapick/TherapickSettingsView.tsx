'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Calendar, Wallet, Bell, 
  Globe, Shield, Check, CheckCircle2, RefreshCw, Key
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickSettingsView() {
  const { 
    system, 
    calendarVisibility, 
    setCalendarVisibility,
    showOnAffiliateCalendars,
    setShowOnAffiliateCalendars,
    defaultBookingStatus: contextDefaultStatus,
    setDefaultBookingStatus: setContextDefaultStatus,
    whatsappAutoStatus: contextWaStatus,
    setWhatsappAutoStatus: setContextWaStatus
  } = useTherapickAdmin();

  const [activeCategory, setActiveCategory] = useState<'general' | 'booking' | 'payments' | 'notifications' | 'integrations' | 'access'>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('THERAPICK Bali Home Spa & Massage');
  const [timeZone, setTimeZone] = useState('(UTC+08:00) Bali');
  const [defaultBookingStatus, setDefaultBookingStatus] = useState(contextDefaultStatus || 'In Progress');
  const [whatsappAutoStatus, setWhatsappAutoStatus] = useState(contextWaStatus || 'In Progress');
  const [showWebsiteCalendar, setShowWebsiteCalendar] = useState(calendarVisibility !== false);
  const [allowReschedule, setAllowReschedule] = useState(true);

  // Booking & Calendar settings
  const [bufferTime, setBufferTime] = useState('30');
  const [advanceNotice, setAdvanceNotice] = useState('2');
  const [maxDailyCapacity, setMaxDailyCapacity] = useState('18');

  // Payment settings
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptOnline, setAcceptOnline] = useState(true);
  const [requireDeposit, setRequireDeposit] = useState(false);

  // Notification settings
  const [notifyWhatsAppAdmin, setNotifyWhatsAppAdmin] = useState(true);
  const [notifyEmailCustomer, setNotifyEmailCustomer] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setCalendarVisibility(showWebsiteCalendar);
    setContextDefaultStatus(defaultBookingStatus);
    setContextWaStatus(whatsappAutoStatus);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Settings saved successfully!');
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-[#facc15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER (MATCHING MOCKUP IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Website system configuration.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TWO COLUMN SETTINGS LAYOUT (MATCHING MOCKUP IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Category Pills (~3 cols / 25%) */}
        <div className="md:col-span-4 lg:col-span-3 space-y-1.5">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'booking', label: 'Booking & Calendar', icon: Calendar },
            { id: 'payments', label: 'Payments', icon: Wallet },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'integrations', label: 'Integrations', icon: Globe },
            { id: 'access', label: 'User Access', icon: Shield },
          ].map(item => {
            const isActive = activeCategory === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCategory(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#FACC15] text-neutral-950 shadow-xs'
                    : 'bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Settings Form (~8-9 cols / 75%) */}
        <div className="md:col-span-8 lg:col-span-9 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* GENERAL SETTINGS (MATCHING MOCKUP IMAGE 2 BOTTOM RIGHT) */}
            {activeCategory === 'general' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                    General Settings
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure your business profile, operational timezone, and customer booking rules.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Time Zone
                      </label>
                      <select
                        value={timeZone}
                        onChange={e => setTimeZone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="(UTC+08:00) Bali">(UTC+08:00) Bali (WITA)</option>
                        <option value="(UTC+07:00) Jakarta">(UTC+07:00) Jakarta (WIB)</option>
                        <option value="(UTC+09:00) Jayapura">(UTC+09:00) Jayapura (WIT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Default Booking Status
                      </label>
                      <select
                        value={defaultBookingStatus}
                        onChange={e => {
                          setDefaultBookingStatus(e.target.value);
                          setWhatsappAutoStatus(e.target.value);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="In Progress">In Progress (Default)</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending Review</option>
                      </select>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Status automatically assigned when CS sends a WhatsApp chat message.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switches Matching Mockup */}
                  <div className="pt-3 border-t border-stone-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Show Website Calendar</div>
                        <div className="text-[11px] text-stone-500">Display availability calendar on booking page</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWebsiteCalendar(!showWebsiteCalendar)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showWebsiteCalendar ? 'bg-[#FACC15]' : 'bg-stone-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            showWebsiteCalendar ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Allow Customer Reschedule</div>
                        <div className="text-[11px] text-stone-500">Let customers reschedule their booking up to 4 hours before</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowReschedule(!allowReschedule)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          allowReschedule ? 'bg-[#FACC15]' : 'bg-stone-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            allowReschedule ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKING & CALENDAR SETTINGS */}
            {activeCategory === 'booking' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">Booking & Calendar Rules</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Buffer Between Sessions (Minutes)</label>
                    <input
                      type="number"
                      value={bufferTime}
                      onChange={e => setBufferTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Min. Advance Notice (Hours)</label>
                    <input
                      type="number"
                      value={advanceNotice}
                      onChange={e => setAdvanceNotice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS SETTINGS */}
            {activeCategory === 'payments' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">Payment Gateway & Methods</h2>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={acceptOnline}
                      onChange={e => setAcceptOnline(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Accept Online Payment (Bank Transfer / QRIS / Midtrans)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={acceptCash}
                      onChange={e => setAcceptCash(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Accept Cash on Arrival at Client Villa</span>
                  </label>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS SETTINGS */}
            {activeCategory === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">Notification Alerts</h2>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={notifyWhatsAppAdmin}
                      onChange={e => setNotifyWhatsAppAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Send immediate WhatsApp dispatch alert to Admin on new website bookings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={notifyEmailCustomer}
                      onChange={e => setNotifyEmailCustomer(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Send booking confirmation & calendar invite to customer email</span>
                  </label>

                  <div className="pt-3 border-t border-stone-100">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      WhatsApp Dispatch Auto-Status
                    </label>
                    <select
                      value={whatsappAutoStatus}
                      onChange={e => {
                        setWhatsappAutoStatus(e.target.value);
                        setDefaultBookingStatus(e.target.value);
                      }}
                      className="w-full sm:w-80 px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="In Progress">In Progress (Recommended)</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending Review</option>
                    </select>
                    <p className="text-[11px] text-stone-500 mt-1">
                      When CS clicks the WhatsApp Chat button on a booking, it automatically marks the treatment as In Progress.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS SETTINGS */}
            {activeCategory === 'integrations' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">System Integrations</h2>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Website Domain:</span>
                    <span className="font-mono font-bold text-emerald-700">booktherapick.com (Connected)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Supabase Database:</span>
                    <span className="font-mono font-bold text-emerald-700">Active (Brand: Therapick)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WhatsApp Gateway:</span>
                    <span className="font-mono font-bold text-neutral-800">Operational</span>
                  </div>
                </div>
              </div>
            )}

            {/* USER ACCESS */}
            {activeCategory === 'access' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">Admin Roles & Permissions</h2>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  Role-based access is active. System maintains isolated operational permissions between the Website Management environment and Affiliate Partner operations.
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin text-[#facc15]" /> : <Check size={14} />}
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
