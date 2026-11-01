import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminCrmShell from '@/components/admin/AdminCrmShell';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center text-stone-400 font-sans text-xs">Loading Admin Console...</div>}>
      <AdminCrmShell serverHost={host}>{children}</AdminCrmShell>
    </Suspense>
  );
}

