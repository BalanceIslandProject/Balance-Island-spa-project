import React, { Suspense } from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Program Settings | Therapick Admin',
  description: 'Configure default commission rate, attribution window, and program policies.',
};

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading settings console...</div>}>
      <TherapickMasterView forcedTab="settings" />
    </Suspense>
  );
}
