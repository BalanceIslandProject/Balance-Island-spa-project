import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Commission Ledger | Therapick Admin',
  description: 'Manage 15% partner commissions, verify payments, and handle adjustments.',
};

export default function AdminCommissionsPage() {
  return <TherapickMasterView forcedTab="commission" />;
}
