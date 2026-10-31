import React from 'react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Affiliates | Therapick Admin Console',
  description: 'Manage partners, referral codes, and commission payouts.',
};

export default function AdminAffiliatesPage() {
  return <AffiliateManagement initialSubTab="partners" />;
}
