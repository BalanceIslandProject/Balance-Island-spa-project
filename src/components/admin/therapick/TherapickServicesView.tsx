'use client';

import React from 'react';
import { Sparkles, Clock, DollarSign, Award, ChevronRight } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickServicesView() {
  const { servicesList, bookings } = useTherapickAdmin();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Treatment Services Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Signature in-villa massage protocols, session durations, and therapist labor allocations.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicesList.map(s => {
          const serviceBookings = bookings.filter(b => b.service_name.includes(s.name.split(' ')[0]));
          const therapistFeeShare = Math.round(s.price * 0.45);

          return (
            <div 
              key={s.id} 
              className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                    {s.duration} mins
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-900">{s.name}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Deep therapeutic Balinese bodywork using organic cold-pressed coconut oil, acupressure points, and gentle palm stretching.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-stone-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-400">Treatment Price</span>
                  <span className="text-base font-extrabold font-mono text-neutral-900">
                    Rp {s.price.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-stone-400">Therapist Fee (45%)</span>
                  <span className="font-mono font-semibold text-stone-600">
                    Rp {therapistFeeShare.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-stone-400">Total Bookings</span>
                  <span className="font-bold text-neutral-900">
                    {serviceBookings.length} completed
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
