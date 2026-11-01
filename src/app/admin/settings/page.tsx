import React from 'react';
import TherapickMasterView from '@/components/admin/therapick/TherapickMasterView';

export const metadata = {
  title: 'Partner Program Settings | Therapick Admin',
  description: 'Configure default commission rate, attribution window, and program policies.',
};

export default function AdminSettingsPage() {
  return <TherapickMasterView forcedTab="settings" />;
}
