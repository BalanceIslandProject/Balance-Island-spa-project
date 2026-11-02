import React, { Suspense } from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Bookings & Attribution | Therapick Admin',
  description: 'Manage bookings, verify treatments and payments, and track partner attribution.',
};

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading bookings console...</div>}>
      <TherapickMasterView forcedTab="bookings" />
    </Suspense>
  );
}
