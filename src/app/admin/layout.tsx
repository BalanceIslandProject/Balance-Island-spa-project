import { Suspense } from 'react';
import AdminCrmShell from '@/components/admin/AdminCrmShell';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center text-stone-400">Loading Admin Console...</div>}>
      <AdminCrmShell>{children}</AdminCrmShell>
    </Suspense>
  );
}
