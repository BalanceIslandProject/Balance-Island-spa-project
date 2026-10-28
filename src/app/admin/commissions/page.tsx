import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AffiliateManagement from '@/components/admin/AffiliateManagement';

export const metadata = {
  title: 'Commission Ledger | Therapick Admin',
  description: 'Manage 15% partner commissions, verify payments, and handle adjustments.',
};

export default function AdminCommissionsPage() {
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
              Commission Ledger
            </h1>
            <p className="text-xs text-neutral-500">
              Review eligible treatment amounts, verify payment status, and approve commissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/payouts"
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:bg-neutral-50 transition-colors"
          >
            Payouts
          </Link>
        </div>
      </div>

      <AffiliateManagement initialSubTab="commissions" />
    </div>
  );
}
