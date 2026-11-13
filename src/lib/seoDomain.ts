import { normalizeHost } from './domainIsolation';

export type SiteBrand = 'therapick' | 'bali' | 'elexoir';

export interface SeoAreaServed {
  name: string;
  lat: number;
  lng: number;
  type?: 'City' | 'Place' | 'AdministrativeArea';
}

export interface SeoBrandProfile {
  brand: SiteBrand;
  isTherapick: boolean;
  isBaliDomain: boolean;
  isElexoir: boolean;
  name: string;
  legalName?: string;
  baseUrl: string;
  title: string;
  description: string;
  faviconUrl: string;
  iconUrl: string;
  telephone: string;
  email: string;
  geoRegion: string;
  geoPlacename: string;
  geoCoordinates: { lat: number; lng: number };
  icbm: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  areasServed: SeoAreaServed[];
}

export const BALI_GEO_AREAS: SeoAreaServed[] = [
  { name: 'Canggu', lat: -8.6478, lng: 115.1385, type: 'City' },
  { name: 'Seminyak', lat: -8.6896, lng: 115.1686, type: 'City' },
  { name: 'Ubud', lat: -8.5069, lng: 115.2625, type: 'City' },
  { name: 'Uluwatu', lat: -8.8149, lng: 115.0884, type: 'City' },
  { name: 'Nusa Dua', lat: -8.7963, lng: 115.2191, type: 'City' },
  { name: 'Sanur', lat: -8.7058, lng: 115.2625, type: 'City' },
  { name: 'Jimbaran', lat: -8.7725, lng: 115.1767, type: 'City' },
  { name: 'Kuta & Legian', lat: -8.7210, lng: 115.1698, type: 'City' },
  { name: 'Pererenan', lat: -8.6385, lng: 115.1250, type: 'City' },
  { name: 'Kerobokan & Umalas', lat: -8.6657, lng: 115.1661, type: 'City' },
  { name: 'Bali Province', lat: -8.4095, lng: 115.1889, type: 'AdministrativeArea' },
];

export const UBUD_GEO_AREAS: SeoAreaServed[] = [
  { name: 'Ubud Center', lat: -8.5069, lng: 115.2625, type: 'Place' },
  { name: 'Sayan, Ubud', lat: -8.4983, lng: 115.2427, type: 'Place' },
  { name: 'Penestanan, Ubud', lat: -8.5112, lng: 115.2505, type: 'Place' },
  { name: 'Kedewatan, Ubud', lat: -8.4833, lng: 115.2417, type: 'Place' },
  { name: 'Campuhan, Ubud', lat: -8.5031, lng: 115.2558, type: 'Place' },
  { name: 'Tegallalang, Ubud', lat: -8.4358, lng: 115.2789, type: 'Place' },
  { name: 'Peliatan, Ubud', lat: -8.5167, lng: 115.2750, type: 'Place' },
  { name: 'Tebongkang, Ubud', lat: -8.5361, lng: 115.2528, type: 'Place' },
  { name: 'Lodtunduh, Ubud', lat: -8.5444, lng: 115.2611, type: 'Place' },
  { name: 'Ubud, Gianyar', lat: -8.5069, lng: 115.2625, type: 'AdministrativeArea' },
];

/**
 * Resolves comprehensive SEO & GEO profile based on host and optional cookie
 */
export function resolveSeoBrandProfile(hostHeader?: string | null, cookieHeader?: string | null): SeoBrandProfile {
  const host = normalizeHost(hostHeader);
  const cookies = cookieHeader || '';

  const isPartnersSubdomain = host.startsWith('partners.') || host.startsWith('partner.');
  const isTherapick = host.includes('booktherapick') || 
                      host.includes('therapick') || 
                      isPartnersSubdomain || 
                      cookies.includes('dev_brand=therapick');

  const isBaliDomain = !isTherapick && (
    ((host.includes('homespaubud') || host.includes('ubudhomespa') || host.includes('balihomespa')) && !host.includes('elexoir')) || 
    cookies.includes('dev_brand=bali')
  );

  const brand: SiteBrand = isTherapick ? 'therapick' : (isBaliDomain ? 'bali' : 'elexoir');

  if (brand === 'therapick') {
    return {
      brand: 'therapick',
      isTherapick: true,
      isBaliDomain: false,
      isElexoir: false,
      name: 'Therapick Bali',
      legalName: 'PT BALANCE ISLAND INDONESIA',
      baseUrl: 'https://www.booktherapick.com',
      title: 'Therapick Bali | Massage Home Service & Outcall In-Villa Spa Bali',
      description: "Bali's premier massage home service and outcall in-villa spa platform. Certified 5-star therapists arrive at your private villa or hotel across Seminyak, Canggu, Ubud, Uluwatu, Sanur & Nusa Dua within 45-60 mins. Pijat panggilan Bali profesional, Balinese massage, deep tissue & couples rituals.",
      faviconUrl: '/therapick-favicon.png',
      iconUrl: '/therapick-logo.png',
      telephone: '+6282266554600',
      email: 'concierge@booktherapick.com',
      geoRegion: 'ID-BA',
      geoPlacename: 'Bali, Indonesia',
      geoCoordinates: { lat: -8.4095, lng: 115.1889 },
      icbm: '-8.4095, 115.1889',
      address: {
        streetAddress: 'Jl. Sunset Road',
        addressLocality: 'Seminyak / Badung',
        addressRegion: 'Bali',
        postalCode: '80361',
        addressCountry: 'ID'
      },
      areasServed: BALI_GEO_AREAS
    };
  }

  if (brand === 'bali') {
    return {
      brand: 'bali',
      isTherapick: false,
      isBaliDomain: true,
      isElexoir: false,
      name: 'Home Spa Ubud',
      baseUrl: 'https://www.homespaubud.com',
      title: 'Home Spa Ubud | In-Villa Massage Home Service & Outcall Spa Ubud, Bali',
      description: 'Experience top-rated massage home service and outcall spa in Ubud, Bali. 5-star certified therapists deliver traditional Balinese healing, deep tissue massage, and couples spa rituals directly to your private villa or resort anywhere in Ubud.',
      faviconUrl: '/homespa.png',
      iconUrl: '/homespa.png',
      telephone: '+6282266554600',
      email: 'info@homespaubud.com',
      geoRegion: 'ID-BA',
      geoPlacename: 'Ubud, Gianyar, Bali, Indonesia',
      geoCoordinates: { lat: -8.5069, lng: 115.2625 },
      icbm: '-8.5069, 115.2625',
      address: {
        streetAddress: 'Jl. Raya Ubud No. 88',
        addressLocality: 'Ubud',
        addressRegion: 'Gianyar, Bali',
        postalCode: '80571',
        addressCountry: 'ID'
      },
      areasServed: UBUD_GEO_AREAS
    };
  }

  // Default: Elexoir Home Spa
  return {
    brand: 'elexoir',
    isTherapick: false,
    isBaliDomain: false,
    isElexoir: true,
    name: 'Elexoir Home Spa Ubud',
    baseUrl: 'https://www.elexoirhomespaubud.com',
    title: 'Elexoir Home Spa | 5-Star Massage Home Service & Outcall Spa in Ubud, Bali',
    description: 'Exclusive 5-star luxury massage home service and outcall spa in Ubud, Bali. Authentic Balinese in-villa massage, deep tissue recovery, and couples wellness sanctuary delivered to your private villa in Ubud Center, Sayan, Penestanan, Kedewatan, and Tegallalang.',
    faviconUrl: '/elexoir.png',
    iconUrl: '/elexoir.png',
    telephone: '+6282266554600',
    email: 'concierge@elexoirhomespaubud.com',
    geoRegion: 'ID-BA',
    geoPlacename: 'Ubud, Gianyar, Bali, Indonesia',
    geoCoordinates: { lat: -8.5069, lng: 115.2625 },
    icbm: '-8.5069, 115.2625',
    address: {
      streetAddress: 'Jl. Raya Ubud No. 88',
      addressLocality: 'Ubud',
      addressRegion: 'Gianyar, Bali',
      postalCode: '80571',
      addressCountry: 'ID'
    },
    areasServed: UBUD_GEO_AREAS
  };
}
