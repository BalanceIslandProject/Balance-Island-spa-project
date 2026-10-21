'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollRevealProvider
 * Automatically attaches smooth scroll-reveal animations to any section or
 * reveal-tagged element across all pages and connected domains.
 */
export default function ScrollRevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    // Check for user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-stagger, [data-reveal]')
        .forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add('is-revealed');
          observer.unobserve(target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.08,
    });

    const registerElements = () => {
      // 1. Target all <section> elements, footer, and explicit data-reveal elements
      const targetSelectors = [
        'section',
        'footer',
        '[data-reveal]',
        '.scroll-reveal',
        '.scroll-reveal-scale',
        '.scroll-reveal-left',
        '.scroll-reveal-right',
        '.scroll-reveal-stagger',
        'main > div > .section-block',
      ].join(', ');

      const elements = document.querySelectorAll(targetSelectors);

      const windowHeight = window.innerHeight;

      elements.forEach((element) => {
        const el = element as HTMLElement;

        // Don't re-observe if already revealed
        if (el.classList.contains('is-revealed')) {
          return;
        }

        // Ensure element has base animation class if it's a section without custom reveal class
        const hasCustomReveal =
          el.classList.contains('scroll-reveal') ||
          el.classList.contains('scroll-reveal-scale') ||
          el.classList.contains('scroll-reveal-left') ||
          el.classList.contains('scroll-reveal-right') ||
          el.classList.contains('scroll-reveal-stagger');

        if (!hasCustomReveal) {
          el.classList.add('scroll-reveal');
        }

        // If element is already in the viewport upon load/navigation, reveal it smoothly
        const rect = el.getBoundingClientRect();
        if (rect.top < windowHeight * 0.85 && rect.bottom > 0) {
          // Slight delay for initial viewport elements for smooth initial entrance
          setTimeout(() => {
            el.classList.add('is-revealed');
          }, 60);
        } else {
          observer.observe(el);
        }
      });
    };

    // Initial register
    registerElements();

    // Re-check after async content loads (e.g. Supabase treatments/campaigns)
    const timeout1 = setTimeout(registerElements, 300);
    const timeout2 = setTimeout(registerElements, 1000);

    // Watch for dynamic DOM changes (e.g. modals opening, lists filtering)
    const mutationObserver = new MutationObserver(() => {
      registerElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Safety fallback: reveal any still-hidden elements after 3s to guarantee no content is hidden
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-stagger, [data-reveal]')
        .forEach((el) => {
          if (!el.classList.contains('is-revealed')) {
            el.classList.add('is-revealed');
          }
        });
    }, 3000);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(safetyTimer);
    };
  }, [pathname]);

  return null;
}
