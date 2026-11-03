'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Keeps the Therapick glass theme scoped to customer-facing pages.
 * The attribute is first set by an inline <head> script (no flash on load);
 * this component keeps it in sync during client-side navigation so the
 * admin console and partner portal never inherit the customer theme.
 * Purely presentational — no business or routing logic.
 */
export default function GlassThemeScope({ enabled }: { enabled: boolean }) {
    const pathname = usePathname() || '/';

    useEffect(() => {
        const root = document.documentElement;
        const isExcluded = /^\/(admin|partners)(\/|$)/.test(pathname);
        if (enabled && !isExcluded) {
            root.setAttribute('data-site-theme', 'glass');
        } else {
            root.removeAttribute('data-site-theme');
        }
    }, [enabled, pathname]);

    return null;
}

