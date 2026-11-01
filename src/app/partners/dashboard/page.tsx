import { redirect } from 'next/navigation';

export default function PartnerDashboardRedirect() {
  redirect('/partners/bookings');
}
