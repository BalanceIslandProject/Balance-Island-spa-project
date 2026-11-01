import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Bookings & Attribution | Therapick Admin',
  description: 'Manage bookings, verify treatments and payments, and track partner attribution.',
};

export default function AdminBookingsPage() {
  return <TherapickMasterView forcedTab="bookings" />;
}
