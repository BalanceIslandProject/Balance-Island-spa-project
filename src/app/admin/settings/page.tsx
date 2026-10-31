import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Partner Program Settings | Therapick Admin',
  description: 'Configure default commission rate, attribution window, and program policies.',
};

export default function AdminSettingsPage() {
  return <AffiliateManagement initialSubTab="settings" />;
}
