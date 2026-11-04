import React, { Suspense } from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Campaign Cards & Promotions | Therapick Admin',
  description: 'Configure seasonal campaign cards, ticket discounts, and eligible spa rituals for the storefront.',
};

export default function AdminCampaignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading campaign console...</div>}>
      <TherapickMasterView forcedTab="campaigns" />
    </Suspense>
  );
}

