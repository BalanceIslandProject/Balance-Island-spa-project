'use client';

import React, { useState } from 'react';
import { User, Star, Clock, CheckCircle2, Phone, Calendar, Plus, Award } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickTherapistsView() {
  const { therapistsList, bookings } = useTherapickAdmin();
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Therapists & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage certified spa practitioners, track completed treatments, and monitor client feedback.
          </p>
        </div>
      </div>

      {/* Therapists Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {therapistsList.map(t => {
          const therapistBookings = bookings.filter(b => b.therapist_name === t.name);

          return (
            <div 
              key={t.id} 
              className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4 hover:border-amber-400 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-neutral-900 font-extrabold text-sm">
                    {String(t.name || '').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">{t.name}</h3>
                    <p className="text-xs text-stone-500">{t.specialization}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                  {t.status === 'active' ? 'Available' : 'Busy'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100">
                <div className="bg-stone-50 p-2.5 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block">Rating</span>
                  <div className="flex items-center gap-1 font-bold text-neutral-900 mt-0.5">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span>{t.rating} / 5.0</span>
                  </div>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block">Completed</span>
                  <div className="font-bold text-neutral-900 mt-0.5">
                    {t.completed_bookings} sessions
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span>Active Today: <strong>{therapistBookings.length} bookings</strong></span>
                <span className="text-amber-700 font-semibold">Verified Practitioner</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
