import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Payouts | Therapick Admin',
  description: 'Process partner disbursements, upload payment proofs, and reconcile commission payouts.',
};

export default function AdminPayoutsPage() {
  return <TherapickMasterView forcedTab="payouts" />;
}
