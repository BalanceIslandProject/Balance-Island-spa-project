import React, { Suspense } from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Commission Ledger | Therapick Admin',
  description: 'Manage 15% partner commissions, verify payments, and handle adjustments.',
};

export default function AdminCommissionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading commission ledger...</div>}>
      <TherapickMasterView forcedTab="commission" />
    </Suspense>
  );
}
