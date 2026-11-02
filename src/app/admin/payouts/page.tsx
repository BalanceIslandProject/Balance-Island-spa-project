import React, { Suspense } from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Payouts | Therapick Admin',
  description: 'Process partner disbursements, upload payment proofs, and reconcile commission payouts.',
};

export default function AdminPayoutsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading payouts console...</div>}>
      <TherapickMasterView forcedTab="payouts" />
    </Suspense>
  );
}
