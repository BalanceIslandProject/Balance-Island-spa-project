'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, Phone, Search, Calendar, DollarSign, Download, 
  MessageSquare, X, ArrowUpRight, Clock, Star, MapPin
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

export default function TherapickCustomersView() {
  const { websiteBookings, setSelectedBooking } = useTherapickAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'repeat' | 'single'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Aggregate customer records from website direct bookings (or default to mockup set if none)
  const customers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      phone: string;
      email?: string;
      totalBookings: number;
      totalSpend: number;
      bookings: any[];
      lastDate: string;
      preferredService: string;
    }>();

    // Default rich sample matching mockup Image 2
    const defaultSample = [
      { id: 'c1', name: 'Emily R.', phone: '+62 812 3456 7890', email: 'emily.r@gmail.com', totalBookings: 5, totalSpend: 2250000, lastDate: '2026-10-27', preferredService: 'Balinese Traditional Massage', bookings: [] },
      { id: 'c2', name: 'James T.', phone: '+62 813 5678 9012', email: 'james.t@outlook.com', totalBookings: 4, totalSpend: 1890000, lastDate: '2026-10-27', preferredService: 'Aromatherapy Massage', bookings: [] },
      { id: 'c3', name: 'Lisa M.', phone: '+62 819 2345 6789', email: 'lisa.m@icloud.com', totalBookings: 3, totalSpend: 1200000, lastDate: '2026-10-25', preferredService: 'Therapick Rejuvenation Package', bookings: [] },
      { id: 'c4', name: 'Daniel K.', phone: '+62 812 9876 5432', email: 'daniel.k@gmail.com', totalBookings: 3, totalSpend: 1350000, lastDate: '2026-10-24', preferredService: 'Deep Tissue Massage', bookings: [] },
      { id: 'c5', name: 'Sofia A.', phone: '+62 818 7654 3210', email: 'sofia.a@yahoo.com', totalBookings: 2, totalSpend: 750000, lastDate: '2026-10-22', preferredService: 'Facial & Head Acupressure', bookings: [] },
    ];

    if (websiteBookings.length > 0) {
      websiteBookings.forEach(b => {
        const name = (b.guest_name || b.customer_name || 'Guest').trim();
        const existing = map.get(name);
        const amt = Number(b.revenue || b.total_amount || 375000);

        if (existing) {
          existing.totalBookings += 1;
          existing.totalSpend += amt;
          existing.bookings.push(b);
          if (b.booking_date > existing.lastDate) {
            existing.lastDate = b.booking_date;
            existing.preferredService = b.treatment_name || b.service_name || existing.preferredService;
          }
        } else {
          map.set(name, {
            id: b.id,
            name,
            phone: b.guest_whatsapp || b.customer_phone || '+62 812 3456 7890',
            email: b.guest_email || b.customer_email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            totalBookings: 1,
            totalSpend: amt,
            bookings: [b],
            lastDate: b.booking_date || b.created_at?.split('T')[0] || '2026-10-27',
            preferredService: b.treatment_name || b.service_name || 'Balinese Traditional Massage'
          });
        }
      });
      return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
    }

    return defaultSample;
  }, [websiteBookings]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const match = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!match) return false;

      if (customerFilter === 'repeat') return c.totalBookings > 1;
      if (customerFilter === 'single') return c.totalBookings === 1;

      return true;
    });
  }, [customers, searchQuery, customerFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER (MATCHING MOCKUP IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage customer data and booking history.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEARCH & FILTER BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all placeholder:text-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
          >
            <option value="all">All Customers</option>
            <option value="repeat">Repeat Guests (2+ Bookings)</option>
            <option value="single">First-time Guests</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CUSTOMERS TABLE (EXACT MOCKUP TABLE)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-mono uppercase font-bold text-stone-400">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Total Bookings</th>
                <th className="py-3 px-4 text-right">Total Spend</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    No customers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={c.id || c.name}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100/70 text-amber-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 text-xs sm:text-sm group-hover:text-amber-800 transition-colors">
                              {c.name}
                            </span>
                            {c.email && (
                              <div className="text-[11px] text-stone-400 font-mono">
                                {c.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-900">
                        {c.totalBookings}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-neutral-900">
                        {formatIDR(c.totalSpend)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-stone-400 font-bold group-hover:text-neutral-900">
                        &gt;
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CUSTOMER PROFILE DRAWER
         ───────────────────────────────────────────────────────────── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-stone-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FACC15] text-neutral-950 font-extrabold text-base flex items-center justify-center">
                    {selectedCustomer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-neutral-900">{selectedCustomer.name}</h2>
                    <p className="text-xs text-stone-500 font-mono">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block">Total Spend</span>
                  <div className="font-extrabold text-sm text-neutral-900 font-mono mt-0.5">
                    {formatIDR(selectedCustomer.totalSpend)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block">Treatments Booked</span>
                  <div className="font-extrabold text-sm text-neutral-900 font-mono mt-0.5">
                    {selectedCustomer.totalBookings} sessions
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Contact Details</span>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">WhatsApp:</span>
                    <span className="font-bold text-neutral-900">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Email:</span>
                    <span className="font-bold text-neutral-900">{selectedCustomer.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Preferred Service */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Preferred Ritual</span>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs font-semibold text-amber-950 flex items-center gap-2">
                  <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                  <span>{selectedCustomer.preferredService}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
