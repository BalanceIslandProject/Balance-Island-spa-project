'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Check if error is a chunk load error typically caused by new deployments
    const isChunkError = 
      error?.name === 'ChunkLoadError' || 
      /loading chunk|missing chunk|failed to fetch/i.test(error?.message || '');

    if (isChunkError && typeof window !== 'undefined') {
      const hasRetried = sessionStorage.getItem('chunk_retry');
      if (!hasRetried) {
        sessionStorage.setItem('chunk_retry', '1');
        window.location.reload();
        return;
      }
    }

    console.error('Handled application error:', error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk_retry');
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAFAF8] text-[#111827]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-black/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
        <div className="w-12 h-12 mx-auto mb-5 rounded-2xl bg-[#0F172A]/[0.04] flex items-center justify-center text-[#0F172A]">
          <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-[#0F172A] mb-2">
          Page refreshed with new updates
        </h2>
        <p className="text-sm text-[#64748B] font-light leading-relaxed mb-6">
          A new version has been deployed. Please reload the page to load the latest treatments and schedule.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleReload}
            className="w-full py-3 px-5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-sm font-semibold tracking-wide transition-all active:scale-[0.98] shadow-sm"
          >
            Reload Page
          </button>
          <a
            href="/"
            className="w-full py-3 px-5 rounded-xl bg-transparent hover:bg-black/[0.03] text-[#475569] text-sm font-medium transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
