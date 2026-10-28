import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Partner Program Settings | Therapick Admin',
  description: 'Configure default commission rate, attribution window, and program policies.',
};

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              Partner Program Settings
            </h1>
            <p className="text-xs text-neutral-500">
              Configure attribution duration, standard 15% rate, and automated rules
            </p>
          </div>
        </div>
      </div>

      <AffiliateManagement initialSubTab="settings" />
    </div>
  );
}
