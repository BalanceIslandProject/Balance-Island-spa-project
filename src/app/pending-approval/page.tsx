'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, ArrowRight, RefreshCw, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import PartnerAuthProvider from '@/components/partner/PartnerAuthProvider';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [partner, setPartner] = useState<any>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/partner/status');
      const data = await res.json();
      if (data.success && data.partner) {
        setPartner(data.partner);
        if (data.isApproved) {
          router.push('/partner');
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const isApproved = partner?.status === 'active' || partner?.status === 'approved';
  const isRejected = partner?.status === 'rejected';
  const isSuspended = partner?.status === 'suspended';

  return (
    <PartnerAuthProvider>
      <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-lg space-y-6 text-center">
          
          <Link href="/partners" className="inline-block">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-10 sm:h-12 w-auto mx-auto object-contain"
            />
          </Link>

          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            
            {/* Status Icon */}
            <div className="flex justify-center">
              {isApproved ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={32} />
                </div>
              ) : isRejected ? (
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <AlertCircle size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-pulse">
                  <Clock size={32} />
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
                {isApproved
                  ? 'Application Approved!'
                  : isRejected
                  ? 'Application Not Approved'
                  : 'Application Pending Review'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                {isApproved
                  ? 'Your partner account has been approved by Therapick administration. Your referral link is now active.'
                  : isRejected
                  ? 'We regret to inform you that your application could not be approved at this time. Please contact support for inquiries.'
                  : 'Thank you for applying to the Therapick Partner Network. Our team reviews all new applications within 24–48 hours.'}
              </p>
            </div>

            {/* Partner Application Card */}
            {partner && (
              <div className="p-4 bg-neutral-50 border border-neutral-200/70 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                  <span className="text-neutral-500 font-medium">Partner Code:</span>
                  <span className="font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    {partner.partner_code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Applicant:</span>
                  <span className="font-medium text-neutral-800">{partner.full_name || partner.business_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRejected
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{partner.status}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                  <span>Commission Rate:</span>
                  <span>{partner.commission_rate_pct || 15}% on completed rituals</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2.5">
              {isApproved ? (
                <Link
                  href="/partner"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-950 text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <span>Enter Partner Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <>
                  <button
                    onClick={checkStatus}
                    disabled={checking}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-950 text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-60"
                  >
                    <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
                    <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
                  </button>

                  <a
                    href="https://wa.me/6285174119423?text=Hello%20Therapick,%20I%20have%20submitted%20a%20partner%20application%20and%20would%20like%20to%20follow%20up."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-xs font-medium hover:bg-neutral-50 transition-colors"
                  >
                    <MessageSquare size={13} className="text-emerald-700" />
                    <span>Expedite via WhatsApp Concierge</span>
                  </a>
                </>
              )}
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
              <ShieldCheck size={13} className="text-neutral-400" />
              <span>Strictly Authoritative Server-Side Status Enforcement</span>
            </div>
          </div>

          <div className="text-center text-xs text-neutral-400">
            <span>Therapick Bali • Island Relaxation, Delivered.</span>
          </div>
        </div>
      </div>
    </PartnerAuthProvider>
  );
}
