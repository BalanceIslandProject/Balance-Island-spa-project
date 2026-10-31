import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Partner Applications | Therapick Admin',
  description: 'Review and approve pending partner applications.',
};

export default function AdminApplicationsPage() {
  return <AffiliateManagement initialSubTab="applications" />;
}
