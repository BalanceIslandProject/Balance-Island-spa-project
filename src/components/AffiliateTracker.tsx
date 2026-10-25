'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAffiliateCookie, clearAffiliateCookie } from '@/lib/affiliateAttribution';

interface AffiliateTrackerProps {
  brand: string;
}

export default function AffiliateTracker({ brand }: AffiliateTrackerProps) {
  const searchParams = useSearchParams();
  const trackedRef = useRef(false);

  useEffect(() => {
    // STRICT DOMAIN ISOLATION:
    // Only track if active brand is 'therapick'
    if (brand !== 'therapick') return;
    if (trackedRef.current) return;

    const refCode = searchParams?.get('ref');

    // If customer visits directly WITHOUT a referral link:
    if (!refCode) {
      // Check if they are currently inside an active ongoing referral session
      const hasActiveSession = typeof window !== 'undefined' && sessionStorage.getItem('btp_affiliate_ref');
      // If no active session, immediately purge any legacy persistent cookies from this device/phone
      if (!hasActiveSession) {
        clearAffiliateCookie();
      }
      return;
    }

    trackedRef.current = true;
    const cleanCode = refCode.trim().toUpperCase();

    // Call server endpoint to record click and get partner info
    fetch('/api/affiliates/clicks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partnerCode: cleanCode,
        landingPath: window.location.pathname,
        referrer: document.referrer || '',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.partner_id) {
          setAffiliateCookie(data.partner_code, data.partner_id);
        }
      })
      .catch((err) => {
        console.error('Affiliate tracking error:', err);
      });
  }, [brand, searchParams]);

  return null;
}
