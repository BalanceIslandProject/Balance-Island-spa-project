export type SiteBrand = 'therapick' | 'bali' | 'elexoir';

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
  if (h === 'localhost' || h === '127.0.0.1') {
    return true;
  }
  return h.includes('booktherapick') || h.includes('therapick');
}

/**
 * Checks if the host belongs to Home Spa Ubud
 */
export function isBaliHost(host?: string | null): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  return (h.includes('homespaubud') || h.includes('ubudhomespa')) && !h.includes('elexoir');
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
 * Resolves brand from host
 */
export function getSiteBrand(host?: string | null): SiteBrand {
  if (isBookTherapickHost(host)) return 'therapick';
  if (isBaliHost(host)) return 'bali';
  return 'elexoir';
}
