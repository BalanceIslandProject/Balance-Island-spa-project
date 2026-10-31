import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Commission Ledger | Therapick Admin',
  description: 'Manage 15% partner commissions, verify payments, and handle adjustments.',
};

export default function AdminCommissionsPage() {
  return <AffiliateManagement initialSubTab="commissions" />;
}
