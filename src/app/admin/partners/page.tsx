import React, { Suspense } from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Directory | Therapick Admin',
  description: 'Manage active, suspended, and pending affiliate partners.',
};

export default function AdminPartnersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading partners console...</div>}>
      <TherapickMasterView forcedTab="partners" />
    </Suspense>
  );
}
