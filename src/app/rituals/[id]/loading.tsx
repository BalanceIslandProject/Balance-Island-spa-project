import React from 'react';

export default function RitualsLoading() {
  return (
    <div className="min-h-screen bg-background pt-24 md:pt-36 pb-20 px-6 max-w-7xl mx-auto animate-pulse">
      {/* Top back bar skeleton */}
      <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
        <div className="w-10 h-10 rounded-full bg-black/5" />
        <div className="w-10 h-10 rounded-full bg-black/5" />
      </div>

      {/* Category & Title skeleton */}
      <div className="mb-8 max-w-3xl mx-auto">
        <div className="w-24 h-6 rounded-full bg-black/5 mb-4" />
        <div className="w-3/4 max-w-md h-10 md:h-12 rounded-2xl bg-black/5 mb-3" />
        <div className="w-1/2 max-w-xs h-5 rounded-xl bg-black/5" />
      </div>

      {/* Bento Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-3xl mx-auto">
        <div className="bg-white/40 border border-black/5 rounded-[32px] p-6 h-44 flex flex-col justify-between">
          <div className="w-32 h-4 rounded-full bg-black/5" />
          <div className="flex gap-2">
            <div className="flex-1 h-12 rounded-2xl bg-black/5" />
            <div className="flex-1 h-12 rounded-2xl bg-black/5" />
            <div className="flex-1 h-12 rounded-2xl bg-black/5" />
          </div>
        </div>
        <div className="rounded-[32px] p-6 h-44 bg-gradient-to-br from-[#1C1F1D] to-[#2A2E2C] flex flex-col justify-between">
          <div className="w-24 h-4 rounded-full bg-white/10" />
          <div className="w-48 h-8 rounded-xl bg-white/10" />
          <div className="w-full h-12 rounded-2xl bg-white/20" />
        </div>
      </div>

      {/* About Box skeleton */}
      <div className="bg-white/50 border border-white/60 p-6 md:p-8 rounded-[32px] shadow-sm max-w-3xl mx-auto">
        <div className="w-36 h-4 rounded-full bg-black/5 mb-6" />
        <div className="space-y-3 mb-6">
          <div className="w-full h-4 rounded bg-black/5" />
          <div className="w-5/6 h-4 rounded bg-black/5" />
          <div className="w-4/6 h-4 rounded bg-black/5" />
        </div>
      </div>
    </div>
  );
}
