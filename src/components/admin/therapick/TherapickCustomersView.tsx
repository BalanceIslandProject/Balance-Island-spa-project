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

    websiteBookings.forEach(b => {
      const name = (b.guest_name || b.customer_name || 'Guest').trim();
      const existing = map.get(name);
      const amt = Number(b.revenue || b.total_price || b.total_amount || 0);

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
          phone: b.guest_whatsapp || b.customer_phone || '',
          email: b.guest_email || b.customer_email || undefined,
          totalBookings: 1,
          totalSpend: amt,
          bookings: [b],
          lastDate: b.booking_date || b.created_at?.split('T')[0] || '',
          preferredService: b.treatment_name || b.service_name || 'Balinese Traditional Massage'
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
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

  const totalSpendAll = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.totalSpend, 0);
  }, [customers]);

  const repeatCount = useMemo(() => {
    return customers.filter(c => c.totalBookings > 1).length;
  }, [customers]);

  const avgSpend = useMemo(() => {
    return customers.length > 0 ? Math.round(totalSpendAll / customers.length) : 0;
  }, [customers, totalSpendAll]);

  return (
    <div className="space-y-6">
      
      {/* ─── FITLO PAGE HEADER ─── */}
      <div className="fitlo-page-head">
        <div>
          <h1 className="fitlo-page-title">Customers CRM</h1>
          <p className="fitlo-page-sub">
            Guest directory, booking frequencies, and lifetime value analytics.
          </p>
        </div>
      </div>

      {/* ─── FITLO 4 PASTEL KPI TILES ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="fitlo-kpi fitlo-kpi--peach">
          <div className="fitlo-kpi__lbl">Total Guests</div>
          <div className="fitlo-kpi__val">{customers.length}</div>
          <div className="fitlo-kpi__sub">In guest directory</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--cyan">
          <div className="fitlo-kpi__lbl">Repeat Guests</div>
          <div className="fitlo-kpi__val">{repeatCount}</div>
          <div className="fitlo-kpi__sub">Booked 2+ appointments</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--lemon">
          <div className="fitlo-kpi__lbl">Total Spend</div>
          <div className="fitlo-kpi__val text-base sm:text-lg">{formatIDR(totalSpendAll)}</div>
          <div className="fitlo-kpi__sub">Cumulative revenue</div>
        </div>

        <div className="fitlo-kpi fitlo-kpi--pebble">
          <div className="fitlo-kpi__lbl">Avg Spend / Guest</div>
          <div className="fitlo-kpi__val text-base sm:text-lg">{formatIDR(avgSpend)}</div>
          <div className="fitlo-kpi__sub">Lifetime average</div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ─── */}
      <div className="fitlo-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fitlo-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, or phone..."
            className="fitlo-input w-full pl-9"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="fitlo-sides">
            <button
              type="button"
              onClick={() => setCustomerFilter('all')}
              className={`fitlo-sides__btn ${customerFilter === 'all' ? 'is-active' : ''}`}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('repeat')}
              className={`fitlo-sides__btn ${customerFilter === 'repeat' ? 'is-active' : ''}`}
            >
              Repeat ({repeatCount})
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('single')}
              className={`fitlo-sides__btn ${customerFilter === 'single' ? 'is-active' : ''}`}
            >
              First-time ({customers.length - repeatCount})
            </button>
          </div>
        </div>
      </div>

      {/* ─── CUSTOMERS TABLE ─── */}
      <div className="fitlo-card p-0 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="fitlo-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th className="text-center">Total Bookings</th>
                <th className="text-right">Total Spend</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--fitlo-muted)]">
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
                      className="cursor-pointer group"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--fitlo-peach)] text-[var(--fitlo-ink)] font-bold text-xs flex items-center justify-center shrink-0 border border-[rgba(22,26,25,0.06)]">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--fitlo-ink)] text-xs sm:text-sm group-hover:text-[var(--fitlo-accent)] transition-colors">
                              {c.name}
                            </span>
                            {c.email && (
                              <div className="text-[11px] text-[var(--fitlo-muted)]">
                                {c.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="fitlo-num text-[var(--fitlo-ink)]">
                        {c.phone}
                      </td>
                      <td className="text-center fitlo-num font-bold">
                        {c.totalBookings > 1 ? (
                          <span className="fitlo-pill fitlo-pill--good">
                            {c.totalBookings} visits
                          </span>
                        ) : (
                          <span className="fitlo-pill fitlo-pill--info">
                            1 visit
                          </span>
                        )}
                      </td>
                      <td className="text-right fitlo-num font-bold text-[var(--fitlo-ink)]">
                        {formatIDR(c.totalSpend)}
                      </td>
                      <td className="text-right text-[var(--fitlo-muted)] font-bold group-hover:text-[var(--fitlo-ink)]">
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

      {/* ─── CUSTOMER PROFILE DRAWER ─── */}
      {selectedCustomer && (
        <div className="fitlo-modal-backdrop fixed inset-0 z-50 flex justify-end p-0">
          <div className="bg-[var(--fitlo-card)] w-full max-w-md h-full shadow-2xl border-l border-[var(--fitlo-line)] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--fitlo-line)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--fitlo-peach)] text-[var(--fitlo-ink)] font-bold text-base flex items-center justify-center border border-[rgba(22,26,25,0.08)]">
                    {selectedCustomer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--fitlo-ink)]">{selectedCustomer.name}</h2>
                    <p className="text-xs text-[var(--fitlo-muted)] fitlo-num">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-xl text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="fitlo-kpi fitlo-kpi--lemon p-3.5 rounded-xl">
                  <span className="fitlo-kpi__lbl">Total Spend</span>
                  <div className="fitlo-kpi__val text-sm mt-0.5">
                    {formatIDR(selectedCustomer.totalSpend)}
                  </div>
                </div>
                <div className="fitlo-kpi fitlo-kpi--cyan p-3.5 rounded-xl">
                  <span className="fitlo-kpi__lbl">Treatments Booked</span>
                  <div className="fitlo-kpi__val text-sm mt-0.5">
                    {selectedCustomer.totalBookings} sessions
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider">Contact Details</span>
                <div className="p-3.5 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">WhatsApp:</span>
                    <span className="font-bold text-[var(--fitlo-ink)] fitlo-num">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Email:</span>
                    <span className="font-bold text-[var(--fitlo-ink)]">{selectedCustomer.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Preferred Service */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--fitlo-ink)] uppercase tracking-wider">Preferred Ritual</span>
                <div className="p-3.5 rounded-xl bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-xs font-semibold text-[var(--fitlo-ink)] flex items-center gap-2">
                  <Star size={14} className="text-[var(--fitlo-now)] fill-[var(--fitlo-now)] shrink-0" />
                  <span>{selectedCustomer.preferredService}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--fitlo-line)] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="fitlo-btn fitlo-btn--ghost"
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
