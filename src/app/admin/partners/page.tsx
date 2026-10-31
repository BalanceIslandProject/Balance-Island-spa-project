import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Partner Directory | Therapick Admin',
  description: 'Manage active, suspended, and pending affiliate partners.',
};

export default function AdminPartnersPage() {
  return <AffiliateManagement initialSubTab="partners" />;
}
