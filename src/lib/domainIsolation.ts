export type SiteBrand = 'therapick' | 'bali' | 'elexoir';
export type AdminConsoleBrand = 'therapick' | 'elexoir' | 'bali' | 'central';

export interface AdminDomainInfo {
  brand: AdminConsoleBrand;
  isDomainLocked: boolean;
  domainName: string;
  badgeText: string;
  liveSiteUrl: string;
  defaultAdminUrl: string;
}

/**
 * Normalizes host string by trimming port numbers and lowercase
 */
export function normalizeHost(host?: string | null): string {
  if (!host) return '';
  return host.toLowerCase().split(':')[0].trim();
}

/**
 * Checks if the host belongs strictly to BookTherapick
 */
export function isBookTherapickHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  // Local development fallback allows testing, but in production strictly checks therapick
  if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost')) {
    return true;
  }
  return h.includes('booktherapick') || h.includes('therapick') || h.startsWith('partners.') || h.startsWith('partner.');
}

/**
 * Checks if the host belongs to Home Spa Ubud
 */
export function isBaliHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  return (h.includes('homespaubud') || h.includes('ubudhomespa') || h.includes('balihomespa')) && !h.includes('elexoir');
}

/**
 * Checks if the host belongs to Elexoir Home Spa
 */
export function isElexoirHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  if (!h) return true; // default brand
  return !isBookTherapickHost(h) && !isBaliHost(h);
}

/**
 * Resolves brand from host for customer-facing site
 */
export function getSiteBrand(host?: string | null): SiteBrand {
  if (isBookTherapickHost(host)) return 'therapick';
  if (isBaliHost(host)) return 'bali';
  return 'elexoir';
}

/**
 * Resolves admin console domain rules:
 * 1. Therapick domain (booktherapick.com, therapick.me, partners.booktherapick.com)
 *    -> Strictly locked to Therapick Admin System. Switcher is hidden. No mixing with Elexoir or Ubud Spa.
 * 2. Elexoir domain (elexoir.com, www.elexoir.com, etc.)
 *    -> Strictly locked to Elexoir Admin Console. Switcher is hidden.
 * 3. Ubud Home Spa domain (homespaubud.com, ubudhomespa.com, etc.)
 *    -> Strictly locked to Ubud Home Spa Admin Console. Switcher is hidden.
 * 4. Central Admin (central domains or localhost hub)
 *    -> Connected ONLY to Elexoir and Ubud Home Spa (Therapick is completely excluded).
 */
export function getAdminDomainInfo(host?: string | null, requestedBrand?: string | null): AdminDomainInfo {
  const h = normalizeHost(host);

  // 1. Therapick Domain Check (Strictly locked to Therapick Admin System)
  const isTherapickDomain = h.includes('booktherapick') || 
                            h.includes('therapick') || 
                            h.startsWith('partners.') || 
                            h.startsWith('partner.');

  if (isTherapickDomain) {
    return {
      brand: 'therapick',
      isDomainLocked: true,
      domainName: 'THERAPICK',
      badgeText: 'Admin System',
      liveSiteUrl: 'https://www.booktherapick.com',
      defaultAdminUrl: '/admin/bookings',
    };
  }

  // 2. Ubud Home Spa Domain Check (Strictly locked to Ubud Home Spa)
  const isUbudDomain = (h.includes('homespaubud') || h.includes('ubudhomespa') || h.includes('balihomespa')) && !h.includes('elexoir');
  if (isUbudDomain) {
    return {
      brand: 'bali',
      isDomainLocked: true,
      domainName: 'UBUD HOME SPA',
      badgeText: 'Admin Console',
      liveSiteUrl: 'https://www.homespaubud.com',
      defaultAdminUrl: '/admin?brand=bali&tab=treatment',
    };
  }

  // 3. Elexoir Domain Check (Strictly locked to Elexoir)
  const isElexoirDomain = h.includes('elexoir');
  if (isElexoirDomain) {
    return {
      brand: 'elexoir',
      isDomainLocked: true,
      domainName: 'ELEXOIR',
      badgeText: 'Admin Console',
      liveSiteUrl: 'https://www.elexoir.com',
      defaultAdminUrl: '/admin?brand=elexoir&tab=treatment',
    };
  }

  // 4. Localhost / Central Admin Hub (Testing / Central operations)
  // If explicitly testing Therapick isolated console on localhost via ?brand=therapick
  if (requestedBrand === 'therapick') {
    return {
      brand: 'therapick',
      isDomainLocked: true,
      domainName: 'THERAPICK',
      badgeText: 'Admin System',
      liveSiteUrl: '/',
      defaultAdminUrl: '/admin/bookings',
    };
  }

  // In Central Admin Hub (connected only to Elexoir and Ubud Home Spa)
  if (requestedBrand === 'elexoir') {
    return {
      brand: 'elexoir',
      isDomainLocked: false,
      domainName: 'ELEXOIR',
      badgeText: 'Elexoir Console',
      liveSiteUrl: '/',
      defaultAdminUrl: '/admin?brand=elexoir&tab=treatment',
    };
  }

  if (requestedBrand === 'bali') {
    return {
      brand: 'bali',
      isDomainLocked: false,
      domainName: 'UBUD HOME SPA',
      badgeText: 'Ubud Spa Console',
      liveSiteUrl: '/',
      defaultAdminUrl: '/admin?brand=bali&tab=treatment',
    };
  }

  // Default Central Admin (Connected only to Elexoir and Ubud Home Spa)
  return {
    brand: 'central',
    isDomainLocked: false,
    domainName: 'CENTRAL ADMIN',
    badgeText: 'Central Operations',
    liveSiteUrl: '/',
    defaultAdminUrl: '/admin?brand=central&tab=treatment',
  };
}
