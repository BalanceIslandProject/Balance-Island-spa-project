import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Partner Payouts | Therapick Admin',
  description: 'Process partner disbursements, upload payment proofs, and reconcile commission payouts.',
};

export default function AdminPayoutsPage() {
  return <AffiliateManagement initialSubTab="payouts" />;
}
