import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Affiliates | Therapick Admin Console',
  description: 'Manage partners, referral codes, and commission payouts.',
};

export default function AdminAffiliatesPage() {
  return <TherapickMasterView forcedTab="partners" />;
}
