'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Calendar, Wallet, Bell, 
  Globe, Shield, Check, CheckCircle2, RefreshCw, Key,
  Megaphone, ArrowRight, Ticket, ExternalLink
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickSettingsView() {
  const { 
    system, 
    setActiveTab,
    calendarVisibility, 
    setCalendarVisibility,
    showOnAffiliateCalendars,
    setShowOnAffiliateCalendars,
    defaultBookingStatus: contextDefaultStatus,
    setDefaultBookingStatus: setContextDefaultStatus,
    whatsappAutoStatus: contextWaStatus,
    setWhatsappAutoStatus: setContextWaStatus
  } = useTherapickAdmin();

  const [activeCategory, setActiveCategory] = useState<'general' | 'campaign' | 'booking' | 'payments' | 'notifications' | 'integrations' | 'access'>('general');
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
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--fitlo-ink)] text-[var(--fitlo-card)] text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[var(--fitlo-line)] flex items-center gap-2.5 animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-[var(--fitlo-accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FITLO PAGE HEADER ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">Settings & Preferences</h1>
          <p className="fitlo-page-sub">
            Configure business profile, booking rules, notification triggers, and calendar controls.
          </p>
        </div>
      </div>

      {/* ─── TWO COLUMN SETTINGS LAYOUT ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Category Pills */}
        <div className="md:col-span-4 lg:col-span-3 space-y-1.5">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'campaign', label: 'Campaign Cards', icon: Megaphone },
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
                    ? 'bg-[var(--fitlo-accent)] text-white shadow-xs'
                    : 'bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)]'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Settings Form */}
        <div className="md:col-span-8 lg:col-span-9 fitlo-card p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* GENERAL SETTINGS */}
            {activeCategory === 'general' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-[var(--fitlo-ink)] tracking-tight">
                    General Settings
                  </h2>
                  <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                    Configure your business profile, operational timezone, and customer booking rules.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="fitlo-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                        Time Zone
                      </label>
                      <select
                        value={timeZone}
                        onChange={e => setTimeZone(e.target.value)}
                        className="fitlo-input w-full"
                      >
                        <option value="(UTC+08:00) Bali">(UTC+08:00) Bali (WITA)</option>
                        <option value="(UTC+07:00) Jakarta">(UTC+07:00) Jakarta (WIB)</option>
                        <option value="(UTC+09:00) Jayapura">(UTC+09:00) Jayapura (WIT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                        Default Booking Status
                      </label>
                      <select
                        value={defaultBookingStatus}
                        onChange={e => {
                          setDefaultBookingStatus(e.target.value);
                          setWhatsappAutoStatus(e.target.value);
                        }}
                        className="fitlo-input w-full"
                      >
                        <option value="In Progress">In Progress (Default)</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending Review</option>
                      </select>
                      <p className="text-[11px] text-[var(--fitlo-muted)] mt-1">
                        Status automatically assigned when CS sends a WhatsApp chat message.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switches */}
                  <div className="pt-3 border-t border-[var(--fitlo-line)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[var(--fitlo-ink)]">Show Website Calendar</div>
                        <div className="text-[11px] text-[var(--fitlo-muted)]">Display availability calendar on booking page</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWebsiteCalendar(!showWebsiteCalendar)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showWebsiteCalendar ? 'bg-[var(--fitlo-accent)]' : 'bg-[var(--fitlo-line)]'
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
                        <div className="text-xs font-bold text-[var(--fitlo-ink)]">Allow Customer Reschedule</div>
                        <div className="text-[11px] text-[var(--fitlo-muted)]">Let customers reschedule their booking up to 4 hours before</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowReschedule(!allowReschedule)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          allowReschedule ? 'bg-[var(--fitlo-accent)]' : 'bg-[var(--fitlo-line)]'
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

            {/* CAMPAIGN CARD SETTINGS */}
            {activeCategory === 'campaign' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--fitlo-line)]">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--fitlo-ink)] tracking-tight flex items-center gap-2">
                      <Megaphone size={16} className="text-[var(--fitlo-accent)]" />
                      <span>Campaign Card & Storefront Promotion</span>
                    </h2>
                    <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
                      Configure ticket discounts, seasonal banners, and promo packages for booktherapick.com.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('campaigns')}
                    className="fitlo-btn fitlo-btn--primary text-xs shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <span>Open Full Campaign Manager</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Info Card with Live Ticket Demo */}
                <div className="p-4 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--fitlo-ink)]">
                    <span className="flex items-center gap-1.5">
                      <Ticket size={14} className="text-[#3b82f6]" />
                      <span>Active Storefront Promotion</span>
                    </span>
                    <span className="text-[11px] text-[#3b82f6] font-semibold">
                      Live on Homepage
                    </span>
                  </div>

                  <p className="text-xs text-[var(--fitlo-muted)] leading-relaxed">
                    The campaign card appears prominently right below the search bar on the Therapick homepage. Customers tap it to browse eligible discounted rituals with tickets and instant booking calculations.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('campaigns')}
                      className="fitlo-btn fitlo-btn--primary text-xs cursor-pointer"
                    >
                      <Megaphone size={13} />
                      <span>Configure Campaign Cards & Rituals</span>
                    </button>
                    <a
                      href="https://booktherapick.com"
                      target="_blank"
                      rel="noreferrer"
                      className="fitlo-btn fitlo-btn--ghost text-xs"
                    >
                      <ExternalLink size={13} />
                      <span>View on Live Storefront</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKING & CALENDAR SETTINGS */}
            {activeCategory === 'booking' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[var(--fitlo-ink)]">Booking & Calendar Rules</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[var(--fitlo-ink)] mb-1">Buffer Between Sessions (Minutes)</label>
                    <input
                      type="number"
                      value={bufferTime}
                      onChange={e => setBufferTime(e.target.value)}
                      className="fitlo-input w-full fitlo-num"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--fitlo-ink)] mb-1">Min. Advance Notice (Hours)</label>
                    <input
                      type="number"
                      value={advanceNotice}
                      onChange={e => setAdvanceNotice(e.target.value)}
                      className="fitlo-input w-full fitlo-num"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS SETTINGS */}
            {activeCategory === 'payments' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[var(--fitlo-ink)]">Payment Gateway & Methods</h2>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[var(--fitlo-ink)]">
                    <input
                      type="checkbox"
                      checked={acceptOnline}
                      onChange={e => setAcceptOnline(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--fitlo-accent)] focus:ring-[var(--fitlo-accent)]"
                    />
                    <span>Accept Online Payment (Bank Transfer / QRIS / Midtrans)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[var(--fitlo-ink)]">
                    <input
                      type="checkbox"
                      checked={acceptCash}
                      onChange={e => setAcceptCash(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--fitlo-accent)] focus:ring-[var(--fitlo-accent)]"
                    />
                    <span>Accept Cash on Arrival at Client Villa</span>
                  </label>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS SETTINGS */}
            {activeCategory === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[var(--fitlo-ink)]">Notification Alerts</h2>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[var(--fitlo-ink)]">
                    <input
                      type="checkbox"
                      checked={notifyWhatsAppAdmin}
                      onChange={e => setNotifyWhatsAppAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--fitlo-accent)] focus:ring-[var(--fitlo-accent)]"
                    />
                    <span>Send immediate WhatsApp dispatch alert to Admin on new website bookings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[var(--fitlo-ink)]">
                    <input
                      type="checkbox"
                      checked={notifyEmailCustomer}
                      onChange={e => setNotifyEmailCustomer(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--fitlo-accent)] focus:ring-[var(--fitlo-accent)]"
                    />
                    <span>Send booking confirmation & calendar invite to customer email</span>
                  </label>

                  <div className="pt-3 border-t border-[var(--fitlo-line)]">
                    <label className="block text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider mb-1">
                      WhatsApp Dispatch Auto-Status
                    </label>
                    <select
                      value={whatsappAutoStatus}
                      onChange={e => {
                        setWhatsappAutoStatus(e.target.value);
                        setDefaultBookingStatus(e.target.value);
                      }}
                      className="fitlo-input w-full sm:w-80"
                    >
                      <option value="In Progress">In Progress (Recommended)</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending Review</option>
                    </select>
                    <p className="text-[11px] text-[var(--fitlo-muted)] mt-1">
                      When CS clicks the WhatsApp Chat button on a booking, it automatically marks the treatment as In Progress.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS SETTINGS */}
            {activeCategory === 'integrations' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[var(--fitlo-ink)]">System Integrations</h2>
                <div className="p-4 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Website Domain:</span>
                    <span className="fitlo-num font-bold text-[var(--fitlo-accent)]">booktherapick.com (Connected)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Supabase Database:</span>
                    <span className="fitlo-num font-bold text-[var(--fitlo-accent)]">Active (Brand: Therapick)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WhatsApp Gateway:</span>
                    <span className="font-bold text-[var(--fitlo-ink)]">Operational</span>
                  </div>
                </div>
              </div>
            )}

            {/* USER ACCESS */}
            {activeCategory === 'access' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[var(--fitlo-ink)]">Admin Roles & Permissions</h2>
                <div className="p-4 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-xs text-[var(--fitlo-muted)]">
                  Role-based access is active. System maintains isolated operational permissions between the Website Management environment and Affiliate Partner operations.
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="fitlo-btn fitlo-btn--primary flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin text-white" /> : <Check size={14} />}
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
