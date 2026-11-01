'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAffiliateCookie, getAffiliateCookie } from '@/lib/affiliateAttribution';

interface AffiliateTrackerProps {
  brand: string;
}

export default function AffiliateTracker({ brand }: AffiliateTrackerProps) {
  const searchParams = useSearchParams();
  const trackedRef = useRef(false);

  useEffect(() => {
    // STRICT DOMAIN ISOLATION:
    // Only track if active on Therapick domain or brand
    const isTherapickSite = brand === 'therapick' || 
      (typeof window !== 'undefined' && (
        window.location.hostname.includes('therapick') || 
        window.location.hostname.includes('booktherapick')
      ));

    if (!isTherapickSite) return;
    if (trackedRef.current) return;

    const refParam = searchParams?.get('ref');

    // DIRECT VISITS / PAGE REFRESHES:
    // Must preserve any active 30-day affiliate attribution!
    if (!refParam) {
      getAffiliateCookie();
      return;
    }

    const cleanCode = refParam.trim().toUpperCase();
    if (!cleanCode) return;

    trackedRef.current = true;

    // Optimistically set attribution so immediate checkout captures referral
    setAffiliateCookie(cleanCode, '');

    // Validate partner against Supabase database via server endpoint
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
        // Only set/replace referral attribution if partner is valid and active in database
        if (data.success && data.partner_id && data.partner_code) {
          // Confirm verified partner ID
          setAffiliateCookie(data.partner_code, data.partner_id);
        } else {
          console.warn('Rejected invalid or inactive affiliate referral code:', cleanCode);
        }
      })
      .catch((err) => {
        console.error('Affiliate tracking error:', err);
      });
  }, [brand, searchParams]);

  return null;
}
