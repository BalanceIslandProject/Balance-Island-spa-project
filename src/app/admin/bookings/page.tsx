import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TherapickBookingManagement from '@/components/TherapickBookingManagement';

export const metadata = {
  title: 'Bookings & Attribution | Therapick Admin',
  description: 'Manage bookings, verify treatments and payments, and track partner attribution.',
};

export default function AdminBookingsPage() {
  return <TherapickBookingManagement />;
}
