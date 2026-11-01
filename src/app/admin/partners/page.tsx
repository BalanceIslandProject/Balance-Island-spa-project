import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Directory | Therapick Admin',
  description: 'Manage active, suspended, and pending affiliate partners.',
};

export default function AdminPartnersPage() {
  return <TherapickMasterView forcedTab="partners" />;
}
