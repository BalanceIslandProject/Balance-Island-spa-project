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
    const selectedPartner = bookingSource === 'Affiliate' ? partners.find(p => p.id === selectedPartnerId) : undefined;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#facc15]" />
              <h3 className="text-base font-bold text-neutral-900">Create New Booking</h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Add a new booking directly to the {bookingSource} system schedule.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsAddBookingOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* System Attribution Pill Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider font-mono">
              Attribution Channel
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setBookingSource('Website')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  bookingSource === 'Website'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                <span>🌐 Direct Website Booking</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingSource('Affiliate')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  bookingSource === 'Affiliate'
                    ? 'bg-[#facc15] text-neutral-950 shadow-xs'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                <span>👥 Partner / Affiliate Booking</span>
              </button>
            </div>
          </div>

          {/* Partner Dropdown if Affiliate */}
          {bookingSource === 'Affiliate' && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                Select Attributed Partner
              </label>
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-amber-200 rounded-lg p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.business_name ? `(${p.business_name})` : ''} — Ref: {p.referral_code}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-700">
                15% commission will be automatically computed upon confirmation.
              </p>
            </div>
          )}

          {/* Guest Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500">
              Guest Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Guest Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">WhatsApp / Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +62 812 3456 7890"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Room / Suite No.</label>
                <input
                  type="text"
                  placeholder="e.g. Villa 4 or Room 201"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Villa / Hotel Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="e.g. Mandapa, a Ritz-Carlton Reserve, Ubud"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Treatment & Schedule Details */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500">
              Treatment & Schedule
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Service</label>
                <select
                  value={serviceName}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {servicesList.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.duration}m) — Rp {s.price.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Assigned Therapist</label>
                <select
                  value={therapistName}
                  onChange={e => setTherapistName(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Total Amount (IDR)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="number"
                    step="5000"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Special Requests / Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Deep pressure, guest prefers jasmine massage oil."
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                className="w-full text-xs bg-white border border-stone-200 rounded-xl p-3 text-neutral-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddBookingOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold bg-[#facc15] hover:bg-[#eab308] text-neutral-950 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
