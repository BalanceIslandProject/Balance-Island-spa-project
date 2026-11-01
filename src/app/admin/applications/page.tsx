import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Applications | Therapick Admin',
  description: 'Review and approve pending partner applications.',
};

export default function AdminApplicationsPage() {
  return <TherapickMasterView forcedTab="partners" />;
}
