'use client';

import React, { useState, useMemo } from 'react';
import { User, Phone, MapPin, Search, Calendar, DollarSign, Download, MessageSquare } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickCustomersView() {
  const { bookings, setSelectedBooking } = useTherapickAdmin();
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregate customers from bookings
  const customers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      email?: string;
      lastAddress?: string;
      totalBookings: number;
      totalSpend: number;
      lastDate: string;
      channels: Set<string>;
      latestBookingId: string;
    }>();

    bookings.forEach(b => {
      const key = (b.customer_name || 'Guest').trim();
      const existing = map.get(key);
      const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
      const channel = isAff ? 'Affiliate' : 'Website';

      if (existing) {
        existing.totalBookings += 1;
        existing.totalSpend += b.total_amount || 0;
        existing.channels.add(channel);
        if (b.booking_date > existing.lastDate) {
          existing.lastDate = b.booking_date;
          existing.lastAddress = b.location_address;
          existing.latestBookingId = b.id;
        }
      } else {
        map.set(key, {
          name: b.customer_name,
          phone: b.customer_phone || '',
          email: b.customer_email,
          lastAddress: b.location_address,
          totalBookings: 1,
          totalSpend: b.total_amount || 0,
          lastDate: b.booking_date,
          channels: new Set([channel]),
          latestBookingId: b.id
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [bookings]);

  const filtered = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.lastAddress && c.lastAddress.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Guest Directory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Client profiles, lifetime treatment value, in-villa locations, and direct WhatsApp contact.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search by guest name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Contact (WhatsApp)</th>
                <th className="py-3 px-4">Recent Villa / Hotel</th>
                <th className="py-3 px-4 text-center">Bookings</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Acquisition Channel</th>
                <th className="py-3 px-4">Last Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filtered.map((c, idx) => {
                const phoneClean = c.phone.replace(/[^0-9]/g, '');
                const waUrl = phoneClean ? `https://wa.me/${phoneClean}` : null;

                return (
                  <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-neutral-900">{c.name}</td>

                    <td className="py-3.5 px-4">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium font-mono text-[11px] transition-colors"
                        >
                          <MessageSquare size={12} className="text-emerald-600" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-stone-400">{c.phone || '—'}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 max-w-[200px] truncate">
                      {c.lastAddress || 'Client Villa'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold font-mono text-neutral-900 bg-stone-100 px-2 py-0.5 rounded-full text-xs">
                        {c.totalBookings}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono text-neutral-900">
                      Rp {c.totalSpend.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        {Array.from(c.channels).map(ch => (
                          <span
                            key={ch}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ch === 'Website' ? 'bg-blue-50 text-blue-800' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                      {c.lastDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
