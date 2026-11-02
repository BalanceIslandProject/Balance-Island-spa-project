'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, MapPin, Sparkles, Check, DollarSign } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickAddBookingModal() {
  const { 
    isAddBookingOpen, 
    setIsAddBookingOpen, 
    createBooking, 
    system, 
    partners, 
    therapistsList, 
    servicesList 
  } = useTherapickAdmin();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceName, setServiceName] = useState(servicesList[0]?.name || 'Balinese Traditional Massage');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('14:00');
  const [locationAddress, setLocationAddress] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [therapistName, setTherapistName] = useState(therapistsList[0]?.name || 'Wayan S.');
  const [bookingSource, setBookingSource] = useState<'Website' | 'Affiliate'>(system === 'affiliate' ? 'Affiliate' : 'Website');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || '');
  const [amount, setAmount] = useState<number>(375000);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync selectedPartnerId when partners load
  React.useEffect(() => {
    if (!selectedPartnerId && partners.length > 0) {
      setSelectedPartnerId(partners[0].id);
    }
  }, [partners, selectedPartnerId]);

  if (!isAddBookingOpen) return null;

  const handleServiceChange = (name: string) => {
    setServiceName(name);
    const found = servicesList.find(s => s.name === name);
    if (found) {
      setDurationMinutes(found.duration);
      setAmount(found.price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide customer name and phone number.');
      return;
    }

    setIsSubmitting(true);
    const selectedPartner = bookingSource === 'Affiliate' 
      ? (partners.find(p => p.id === selectedPartnerId) || partners[0]) 
      : undefined;

    const res = await createBooking({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      service_name: serviceName,
      duration_minutes: durationMinutes,
      booking_date: bookingDate,
      booking_time: bookingTime,
      location_address: locationAddress.trim() || 'Client Villa / Hotel',
      room_number: roomNumber.trim() || undefined,
      therapist_name: therapistName,
      total_amount: amount,
      source: bookingSource,
      partner_id: selectedPartner?.id,
      partner_name: selectedPartner?.name,
      affiliate_code: selectedPartner?.referral_code,
      special_notes: specialNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Booking successfully created!');
      setTimeout(() => {
        setSuccessMessage(null);
        setIsAddBookingOpen(false);
      }, 1000);
    } else {
      alert(res.error || 'Failed to create booking.');
    }
  };

  return (
    <div className="fitlo-modal-backdrop">
      <div 
        className="w-full max-w-2xl fitlo-card p-0 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--fitlo-line)] flex items-center justify-between bg-[var(--fitlo-card-2)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--fitlo-accent)]" />
              <h3 className="text-base font-bold text-[var(--fitlo-ink)]">Create New Booking</h3>
            </div>
            <p className="text-xs text-[var(--fitlo-muted)] mt-0.5">
              Add a new booking directly to the {bookingSource} system schedule.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsAddBookingOpen(false)}
            className="p-1.5 text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card)] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMessage && (
            <div className="p-3 bg-[var(--fitlo-accent)]/10 border border-[var(--fitlo-accent)]/30 text-[var(--fitlo-accent)] text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-[var(--fitlo-accent)]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* System Attribution Pill Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--fitlo-ink)] mb-1.5 uppercase tracking-wider">
              Attribution Channel
            </label>
            <div className="fitlo-sides w-full">
              <button
                type="button"
                onClick={() => setBookingSource('Website')}
                className={`fitlo-sides__btn flex-1 ${bookingSource === 'Website' ? 'is-active' : ''}`}
              >
                <span>Direct Website Booking</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingSource('Affiliate')}
                className={`fitlo-sides__btn flex-1 ${bookingSource === 'Affiliate' ? 'is-active' : ''}`}
              >
                <span>Partner / Affiliate Booking</span>
              </button>
            </div>
          </div>

          {/* Partner Dropdown if Affiliate */}
          {bookingSource === 'Affiliate' && (
            <div className="p-3 bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] rounded-xl space-y-2">
              <label className="block text-xs font-bold text-[var(--fitlo-ink)]">
                Select Attributed Partner
              </label>
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="fitlo-input w-full"
              >
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.business_name ? `(${p.business_name})` : ''} — Ref: {p.referral_code}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--fitlo-muted)]">
                15% commission will be automatically computed upon confirmation.
              </p>
            </div>
          )}

          {/* Guest Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">
              Guest Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Guest Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-[var(--fitlo-muted)]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="fitlo-input w-full pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">WhatsApp / Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-[var(--fitlo-muted)]" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +62 812 3456 7890"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="fitlo-input w-full pl-9 fitlo-num"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="fitlo-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Room / Suite No.</label>
                <input
                  type="text"
                  placeholder="e.g. Villa 4 or Room 201"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  className="fitlo-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Villa / Hotel Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-[var(--fitlo-muted)]" />
                <input
                  type="text"
                  placeholder="e.g. Mandapa, a Ritz-Carlton Reserve, Ubud"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  className="fitlo-input w-full pl-9"
                />
              </div>
            </div>
          </div>

          {/* Treatment & Schedule Details */}
          <div className="space-y-3 pt-2 border-t border-[var(--fitlo-line)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">
              Treatment & Schedule
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Service</label>
                <select
                  value={serviceName}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="fitlo-input w-full"
                >
                  {servicesList.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.duration}m) — Rp {s.price.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Assigned Therapist</label>
                <select
                  value={therapistName}
                  onChange={e => setTherapistName(e.target.value)}
                  className="fitlo-input w-full"
                >
                  {therapistsList.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.rating}★ · {t.completed_bookings} jobs)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-3 text-[var(--fitlo-muted)]" />
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="fitlo-input w-full pl-9 fitlo-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-3 text-[var(--fitlo-muted)]" />
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="fitlo-input w-full pl-9 fitlo-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Total Amount (IDR)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-3 text-[var(--fitlo-muted)]" />
                  <input
                    type="number"
                    step="5000"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="fitlo-input w-full pl-9 fitlo-num font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--fitlo-ink)] mb-1">Special Requests / Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Deep pressure, guest prefers jasmine massage oil."
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                className="fitlo-input w-full resize-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[var(--fitlo-line)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddBookingOpen(false)}
              className="fitlo-btn fitlo-btn--ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="fitlo-btn fitlo-btn--primary flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating...</span>
              ) : (
                <>
                  <span>Create Booking</span>
                  <Check size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
