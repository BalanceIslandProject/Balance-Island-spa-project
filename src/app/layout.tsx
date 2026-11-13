import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Newsreader, Urbanist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./therapick-glass.css";
import GlassThemeScope from "@/components/therapick/GlassThemeScope";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { SpaProvider } from "@/context/SpaContext";
import { CartProvider } from "@/context/CartContext";
import { headers } from "next/headers";
import { Suspense } from "react";
import AffiliateTracker from "@/components/AffiliateTracker";
import ScrollRevealProvider from "@/components/ScrollRevealProvider";
import { resolveSeoBrandProfile } from "@/lib/seoDomain";
import { createSlug } from "@/utils/slugify";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

// Therapick main-site glass theme typeface (scoped via html[data-site-theme="glass"])
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export async function generateViewport(): Promise<Viewport> {
  const headersList = await headers();
  const hostHeader = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const host = hostHeader.toLowerCase().split(':')[0].trim();
  const isTherapick = host.includes("booktherapick") || host.includes("therapick");

  return {
    themeColor: isTherapick ? "#000000" : "#FFFFFF",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostHeader = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const cookieHeader = headersList.get("cookie") || "";
  const profile = resolveSeoBrandProfile(hostHeader, cookieHeader);

  const isTherapick = profile.isTherapick;
  const isBaliDomain = profile.isBaliDomain;
  const name = profile.name;
  const url = profile.baseUrl;
  const title = profile.title;
  const description = profile.description;
  const faviconUrl = profile.faviconUrl;
  const iconUrl = profile.iconUrl;

  // 2. DOMAIN-ISOLATED TARGET KEYWORDS (Optimized with real Ahrefs search data)
  // High-volume terms: massage home service bali, outcall massage bali, home massage bali, pijat panggilan bali
  const keywords = isTherapick
    ? [
      // Top High-Volume English Terms (Tourists in Bali)
      "massage home service bali",
      "outcall massage bali",
      "home massage bali",
      "bali massage home service",
      "bali outcall massage",
      "massage outcall bali",
      "bali home massage",
      "home service massage bali",
      "in villa massage bali",
      "home service massage bali seminyak",
      "home massage uluwatu",
      "outcall massage canggu",
      "bali massage outcall",
      "massage delivery bali",
      "hotel massage bali",
      "on demand massage bali",
      // Top High-Volume Indonesian Terms (Locals & Domestic Tourists - 2.2x search volume)
      "pijat panggilan bali",
      "pijat panggilan denpasar",
      "massage panggilan bali",
      "spa panggilan bali",
      "pijat panggilan kuta",
      "pijat panggilan bali 24 jam",
      "pijat panggilan bali terdekat",
      "pijat panggilan bali murah",
      "massage panggilan denpasar",
      "tukang pijat panggilan denpasar",
      "spa panggilan bali 24 jam",
      "pijat panggilan di bali",
      "pijat panggilan 24 jam bali",
      "pijat panggilan sanur",
      "pijat panggilan jimbaran",
      "pijat panggilan kuta bali",
      "pijat panggilan canggu",
      "pijat panggilan seminyak",
      "pijat bali panggilan",
      "pijat panggilan area denpasar",
      "pijat panggilan gianyar",
      "pijat panggilan ubud",
      "pijat panggilan nusa dua",
      // Brand & Core Service Terms
      "Therapick",
      "BookTherapick",
      "Therapick Bali",
      "Therapick Mobile Spa",
      "Therapick In Villa Massage",
      "Traditional Balinese Massage",
      "Deep Tissue Massage Bali",
      "Couples Massage Bali",
      "In Villa Couples Massage",
      "Hot Stone Massage Bali",
      "Foot Reflexology Bali",
      "Four Hands Massage Bali",
      "Prenatal Massage Bali",
      "Pregnancy Massage Bali",
      "Aromatherapy Massage Bali",
      "Body Scrub Bali",
      // Regional Keywords
      "Massage Seminyak",
      "In Villa Massage Seminyak",
      "Outcall Massage Seminyak",
      "Massage Canggu",
      "In Villa Massage Canggu",
      "Outcall Massage Canggu",
      "Pererenan Massage",
      "Massage Ubud",
      "In Villa Massage Ubud",
      "Outcall Massage Ubud",
      "Massage Uluwatu",
      "In Villa Massage Uluwatu",
      "Outcall Massage Uluwatu",
      "Massage Nusa Dua",
      "Massage Sanur",
      "Massage Jimbaran",
      "Massage Kuta",
      "Massage Legian",
      "Massage Kerobokan",
      "Massage Umalas",
      "Certified Massage Therapist Bali",
      "Luxury Spa Delivery Bali"
    ]
    : [
      name,
      "massage home service ubud",
      "outcall massage ubud",
      "pijat panggilan ubud",
      "pijat panggilan gianyar",
      "Home Spa Ubud",
      "Mobile Spa Ubud",
      "In Villa Massage Ubud",
      "Massage Ubud Villa",
      "Ubud Home Spa",
      "Best Massage in Ubud",
      "Best Spa in Ubud",
      "Ubud Massage Delivery",
      "Couples Massage Ubud",
      "In Villa Couples Massage Ubud",
      "Traditional Balinese Massage Ubud",
      "Deep Tissue Massage Ubud",
      "Hot Stone Massage Ubud",
      "Foot Reflexology Ubud",
      "Sayan Massage",
      "Sayan Villa Spa",
      "Penestanan Massage",
      "Penestanan Home Spa",
      "Kedewatan Mobile Massage",
      "Kedewatan Villa Spa",
      "Campuhan Massage",
      "Tegallalang Villa Massage",
      "Peliatan Massage",
      "Tebongkang Massage",
      "Lodtunduh Massage",
      "Ubud Luxury Spa",
      "Private Massage Ubud",
      "Massage near me Ubud",
      "Certified Massage Therapist Ubud",
      "Hotel Massage Ubud"
    ];

  // 3. PERFECT GEO METADATA
  // Therapick covers all of Bali; Elexoir and Home Spa target strictly Ubud
  const geoRegion = "ID-BA";
  const geoPlacename = isTherapick ? "Bali, Indonesia" : "Ubud, Gianyar, Bali, Indonesia";
  const geoCoordinates = isTherapick ? "-8.4095;115.1889" : "-8.5069;115.2625";
  const icbm = isTherapick ? "-8.4095, 115.1889" : "-8.5069, 115.2625";

  return {
    metadataBase: new URL(url),
    title: {
      default: title,
      template: isTherapick ? `%s | Therapick Bali` : `%s | ${name}`
    },
    description: description,
    keywords: keywords,
    authors: [{ name: name, url: url }],
    creator: name,
    publisher: name,
    formatDetection: {
      email: false,
      address: false,
      telephone: true,
    },
    icons: isTherapick
      ? {
        icon: [
          { url: '/therapick-favicon.png', type: 'image/png' },
          { url: '/therapick-favicon.png?v=3', type: 'image/png' },
        ],
        shortcut: [
          { url: '/therapick-favicon.png', type: 'image/png' }
        ],
        apple: [
          { url: '/therapick-favicon.png', sizes: '180x180', type: 'image/png' }
        ]
      }
      : {
        icon: [
          { url: `${faviconUrl}?v=2`, type: 'image/png' }
        ],
        shortcut: [
          { url: `${faviconUrl}?v=2`, type: 'image/png' }
        ],
        apple: [
          { url: `${faviconUrl}?v=2`, sizes: '180x180', type: 'image/png' }
        ]
      },
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: name,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: iconUrl,
          width: 800,
          height: 800,
          alt: `${name} Logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [iconUrl],
    },
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'geo.region': geoRegion,
      'geo.placename': geoPlacename,
      'geo.position': geoCoordinates,
      'ICBM': icbm,
      'DC.title': title,
      'DC.creator': name,
      'DC.description': description,
      'DC.coverage': geoPlacename,
      'place:location:latitude': isTherapick ? '-8.4095' : '-8.5069',
      'place:location:longitude': isTherapick ? '115.1889' : '115.2625',
    }
  };
}


import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

// Cache SSR data for 120 seconds to avoid hitting Supabase on every request
const getSpaData = (brand: string) =>
  unstable_cache(
    async () => {
      let treatments: any[] = [];
      let products: any[] = [];
      let campaigns: any[] = [];
      let therapists: any[] = [];
      let spaPartners: any[] = [];
      let partnerTreatments: any[] = [];
      let dynamicPricingPercentage: number = 0;

      try {
        let [treatmentsRes, productsRes, campaignsRes, therapistsRes, spaPartnersRes, partnerTreatmentsRes, dynamicPricingRes] = await Promise.all([
          supabase.from('treatments').select('*').eq('is_published', true).eq('brand', brand).order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('is_published', true).eq('brand', brand).order('created_at', { ascending: false }),
          supabase.from('campaigns').select('*').eq('is_published', true).eq('brand', brand).order('order', { ascending: true }).order('updated_at', { ascending: false }),
          supabase.from('therapists').select('*').eq('is_active', true).eq('brand', brand).order('created_at', { ascending: false }),
          supabase.from('spa_partners').select('*').eq('is_active', true).eq('brand', brand).order('order', { ascending: true }),
          supabase.from('partner_treatments').select('*').eq('is_published', true).eq('brand', brand).order('order', { ascending: true }),
          supabase.from('campaigns').select('discountPercentage').eq('brand', `${brand}_pricing_setting`).maybeSingle()
        ]);

        if (dynamicPricingRes?.data && typeof dynamicPricingRes.data.discountPercentage === 'number') {
          dynamicPricingPercentage = dynamicPricingRes.data.discountPercentage;
        }

        if (brand !== 'elexoir' && (!treatmentsRes.data || treatmentsRes.data.length === 0)) {
          const fallbackRes = await Promise.all([
            supabase.from('treatments').select('*').eq('is_published', true).eq('brand', 'elexoir').order('created_at', { ascending: false }),
            supabase.from('products').select('*').eq('is_published', true).eq('brand', 'elexoir').order('created_at', { ascending: false }),
            supabase.from('therapists').select('*').eq('is_active', true).eq('brand', 'elexoir').order('created_at', { ascending: false })
          ]);
          treatmentsRes = fallbackRes[0];
          productsRes = fallbackRes[1];
          therapistsRes = fallbackRes[2];
        }

        treatments = treatmentsRes.data || [];
        products = productsRes.data || [];
        campaigns = campaignsRes.data || [];
        therapists = therapistsRes.data || [];
        spaPartners = spaPartnersRes.data || [];
        partnerTreatments = partnerTreatmentsRes.data || [];
      } catch (error) {
        console.error("SSR error fetching spa data:", error);
      }

      return { treatments, products, campaigns, therapists, spaPartners, partnerTreatments, dynamicPricingPercentage };
    },
    ['spa-data', brand],
    { revalidate: 120, tags: ['spa-data', `spa-data-${brand}`] }
  )();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "www.elexoirhomespaubud.com";
  const cookieHeader = headersList.get("cookie") || "";
  const profile = resolveSeoBrandProfile(host, cookieHeader);

  const cleanHost = host.toLowerCase().split(':')[0].trim();
  const isPartnersSubdomain = cleanHost.startsWith("partners.");
  const isTherapick = profile.isTherapick;
  const isBaliDomain = profile.isBaliDomain;
  const brand = profile.brand;

  const name = profile.name;
  const url = profile.baseUrl;
  const description = profile.description;
  const faviconUrl = profile.faviconUrl;
  const iconUrl = profile.iconUrl;

  // SSR Data Fetching with server-side caching (120s revalidation)
  const initialData = await getSpaData(brand);

  // Dynamic Treatment Schema Synchronization: Generate live OfferCatalog items from published treatments
  const dynamicOfferCatalogItems = (initialData?.treatments && initialData.treatments.length > 0)
    ? initialData.treatments.slice(0, 20).map((t: any) => {
        const minPrice = Array.isArray(t.options) && t.options.length > 0
          ? Math.min(...t.options.map((o: any) => Number(o.price) || 0))
          : (Number(t.price) || undefined);
        return {
          "@type": "Offer",
          ...(minPrice ? { "price": minPrice, "priceCurrency": "IDR" } : {}),
          "availability": "https://schema.org/InStock",
          "url": `${url}/rituals/${createSlug(t.title)}`,
          "itemOffered": {
            "@type": "Service",
            "name": isTherapick ? `${t.title} (Home Service & Outcall)` : `${t.title} Ubud`,
            "serviceType": `${t.category || 'Balinese Massage'} Home Service`,
            "description": t.short_description || t.description || `${t.title} delivered to your private villa or resort by certified 5-star therapists.`
          }
        };
      })
    : null;

  return (
    <html lang="en" className="antialiased scroll-smooth" suppressHydrationWarning>
      <head>
        {isTherapick && !isPartnersSubdomain && (
          // Applies the Therapick glass theme before first paint (customer pages only, never admin/partners)
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(d){try{if(!/^\\/(admin|partners)(\\/|$)/.test(location.pathname)){d.setAttribute('data-site-theme','glass');}}catch(e){}})(document.documentElement);`,
            }}
          />
        )}
        {isTherapick ? (
          <>
            <link rel="icon" type="image/png" href="/therapick-favicon.png" />
            <link rel="shortcut icon" type="image/png" href="/therapick-favicon.png" />
            <link rel="apple-touch-icon" href="/therapick-favicon.png" />
          </>
        ) : (
          <>
            <link rel="icon" type="image/png" href={`${faviconUrl}?v=2`} />
            <link rel="shortcut icon" type="image/png" href={`${faviconUrl}?v=2`} />
            <link rel="apple-touch-icon" href={`${faviconUrl}?v=2`} />
          </>
        )}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9CFBSVYEY9"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-9CFBSVYEY9');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              isTherapick
                ? {
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "WebSite",
                      "@id": `${url}/#website`,
                      "url": url,
                      "name": "Therapick",
                      "description": "Bali's premier on-demand mobile spa and in-villa massage booking platform.",
                      "inLanguage": "en-US",
                      "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${url}/explore?search={search_term_string}`,
                        "query-input": "required name=search_term_string"
                      }
                    },
                    {
                      "@type": ["HealthAndBeautyBusiness", "DaySpa", "LocalBusiness"],
                      "@id": `${url}/#spa`,
                      "name": "Therapick Bali | Massage Home Service & Outcall In-Villa Spa",
                      "alternateName": [
                        "BookTherapick",
                        "Therapick Bali",
                        "Therapick Massage Home Service",
                        "Therapick Outcall Massage Bali",
                        "Therapick In Villa Massage",
                        "Pijat Panggilan Bali - Therapick",
                        "Pijat Panggilan Denpasar",
                        "Spa Panggilan Bali",
                        "Bali Massage Home Service",
                        "Outcall Massage Bali"
                      ],
                      "legalName": "PT BALANCE ISLAND INDONESIA",
                      "url": url,
                      "logo": `${url}${iconUrl}`,
                      "image": `${url}${iconUrl}`,
                      "sameAs": [
                        "https://www.tripadvisor.com/Attraction_Review-g297701-d34704669-Reviews-Therapick_Island_Relaxation_Delivered-Ubud_Gianyar_Regency_Bali.html",
                        "https://share.google/Aoju5q8u9UeQzvBAs",
                        "https://partners.booktherapick.com"
                      ],
                      "disambiguatingDescription": "Therapick Bali (booktherapick.com) is Bali's leading verified on-demand massage home service, outcall massage, and in-villa spa delivery platform operated across Bali, Indonesia by PT Balance Island Indonesia. Certified 5-star therapists provide professional therapeutic outcall massage and pijat panggilan directly to villas, hotels, and resorts. It is not affiliated with the US directory therapick.com.",
                      "description": "Bali's premier massage home service and outcall in-villa spa platform. Certified 5-star therapists arrive at your private villa or hotel across Seminyak, Canggu, Ubud, Uluwatu, Nusa Dua, Sanur, Jimbaran & Kuta within 45-60 mins. Professional therapeutic massage, pijat panggilan Bali terpercaya, traditional Balinese massage, deep tissue & couples spa.",
                      "knowsAbout": [
                        "Massage Home Service Bali",
                        "Outcall Massage Bali",
                        "Home Massage Bali",
                        "Bali Massage Home Service",
                        "Bali Outcall Massage",
                        "In-Villa Massage Bali",
                        "Pijat Panggilan Bali",
                        "Pijat Panggilan Denpasar",
                        "Massage Panggilan Bali",
                        "Spa Panggilan Bali",
                        "Pijat Panggilan Kuta",
                        "Pijat Panggilan Bali 24 Jam",
                        "Pijat Panggilan Bali Terdekat",
                        "Pijat Panggilan Bali Murah",
                        "Pijat Panggilan Seminyak",
                        "Pijat Panggilan Canggu",
                        "Pijat Panggilan Ubud",
                        "Pijat Panggilan Uluwatu",
                        "Pijat Panggilan Sanur",
                        "Pijat Panggilan Nusa Dua",
                        "Pijat Panggilan Jimbaran",
                        "Home Service Massage Bali Seminyak",
                        "Home Massage Uluwatu",
                        "Outcall Massage Canggu",
                        "Traditional Balinese Massage",
                        "Couples Massage Bali",
                        "Deep Tissue Massage",
                        "Four Hands Massage",
                        "Foot Reflexology",
                        "Hotel Spa Delivery Bali"
                      ],
                      "telephone": "+6282266554600",
                      "email": "concierge@booktherapick.com",
                      "priceRange": "$$",
                      "currenciesAccepted": "IDR, USD, AUD, EUR, GBP, SGD",
                      "paymentAccepted": "Cash, Credit Card, Visa, Mastercard, Bank Transfer, QRIS, Wise",
                      "availableLanguage": ["English", "Indonesian"],
                      "address": {
                        "@type": "PostalAddress",
                        "streetAddress": "Jl. Sunset Road",
                        "addressLocality": "Seminyak / Badung",
                        "addressRegion": "Bali",
                        "postalCode": "80361",
                        "addressCountry": "ID"
                      },
                      "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": -8.4095,
                        "longitude": 115.1889
                      },
                      "openingHoursSpecification": [
                        {
                          "@type": "OpeningHoursSpecification",
                          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                          "opens": "08:00",
                          "closes": "23:30"
                        }
                      ],
                      "areaServed": [
                        { "@type": "City", "name": "Canggu", "geo": { "@type": "GeoCoordinates", "latitude": -8.6478, "longitude": 115.1385 } },
                        { "@type": "City", "name": "Seminyak", "geo": { "@type": "GeoCoordinates", "latitude": -8.6896, "longitude": 115.1686 } },
                        { "@type": "City", "name": "Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.5069, "longitude": 115.2625 } },
                        { "@type": "City", "name": "Uluwatu", "geo": { "@type": "GeoCoordinates", "latitude": -8.8149, "longitude": 115.0884 } },
                        { "@type": "City", "name": "Nusa Dua", "geo": { "@type": "GeoCoordinates", "latitude": -8.7963, "longitude": 115.2191 } },
                        { "@type": "City", "name": "Sanur", "geo": { "@type": "GeoCoordinates", "latitude": -8.7058, "longitude": 115.2625 } },
                        { "@type": "City", "name": "Jimbaran", "geo": { "@type": "GeoCoordinates", "latitude": -8.7725, "longitude": 115.1767 } },
                        { "@type": "City", "name": "Kuta & Legian", "geo": { "@type": "GeoCoordinates", "latitude": -8.7210, "longitude": 115.1698 } },
                        { "@type": "City", "name": "Pererenan", "geo": { "@type": "GeoCoordinates", "latitude": -8.6385, "longitude": 115.1250 } },
                        { "@type": "City", "name": "Kerobokan & Umalas", "geo": { "@type": "GeoCoordinates", "latitude": -8.6657, "longitude": 115.1661 } },
                        { "@type": "AdministrativeArea", "name": "Bali Province", "identifier": "ID-BA" }
                      ],
                      "hasOfferCatalog": {
                        "@type": "OfferCatalog",
                        "name": "Therapick Bali In-Villa Massage Home Service & Outcall Spa Treatments",
                        "itemListElement": dynamicOfferCatalogItems || [
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Traditional Balinese Massage (Home Service & Outcall)",
                              "serviceType": "Balinese Massage Home Service",
                              "description": "Authentic full-body Balinese acupressure, gentle stretching, and rhythmic palm pressure with pure virgin coconut oil delivered to your villa in Bali."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Deep Tissue Muscle Recovery Outcall Massage",
                              "serviceType": "Deep Tissue Outcall Massage",
                              "description": "Firm therapeutic pressure targeting deep muscle layers, releasing myofascial tension and fatigue for active travelers and surfers in Bali."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Couples In-Villa Massage Sanctuary",
                              "serviceType": "Couples Massage Home Service",
                              "description": "Simultaneous side-by-side bespoke luxury massage ritual in your private villa with premium organic aromatherapy oils."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Volcanic Hot Stone Therapy",
                              "serviceType": "Hot Stone Massage",
                              "description": "Heated volcanic basalt river stones melting away deep muscle stiffness and promoting intense nervous system calming."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Foot Reflexology & Lower Leg Revival",
                              "serviceType": "Reflexology Home Service",
                              "description": "Specialized oriental acupressure point stimulation on feet and calves restoring vital energy flow throughout the body."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Four Hands Synchronized Balinese Massage",
                              "serviceType": "Four Hands Outcall Massage",
                              "description": "Two certified therapists working in seamless synchronized harmony for double the relaxation and tension release."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Prenatal Nurturing Pregnancy Massage",
                              "serviceType": "Prenatal Massage Home Service",
                              "description": "Gentle, safe, and deeply soothing side-lying massage tailored specifically for expectant mothers in Bali."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Organic Balinese Lulur Body Scrub & Polish",
                              "serviceType": "Body Scrub & Spa Delivery",
                              "description": "Traditional Indonesian turmeric, rice powder, and sandalwood herbal scrub exfoliating dull skin followed by a refreshing rinse."
                            }
                          }
                        ]
                      }
                    },
                    {
                      "@type": "FAQPage",
                      "@id": `${url}/#faq`,
                      "mainEntity": [
                        {
                          "@type": "Question",
                          "name": "What is massage home service in Bali and how does it work?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Massage home service (also known as outcall massage or in-villa spa) brings certified 5-star massage therapists directly to your private villa, hotel room, or resort across Bali. Therapick therapists arrive with portable professional massage setups, sanitized linens, fresh towels, relaxing ambient soundscapes, and 100% pure organic oils within 45 to 60 minutes."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Can I book outcall massage in Bali to my villa or hotel?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, Therapick specializes in outcall massage across Seminyak, Canggu, Ubud, Uluwatu, Sanur, Nusa Dua, Jimbaran, and Kuta. Our therapists deliver 5-star hotel grade treatments to your doorstep so you never have to navigate Bali traffic."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Apakah melayani pijat panggilan (on-call massage) ke villa dan hotel di Bali?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Ya, kami melayani pijat panggilan profesional 100% terpercaya ke villa pribadi, hotel, dan resort di seluruh Bali (Seminyak, Canggu, Ubud, Uluwatu, Denpasar, Sanur, Jimbaran, Nusa Dua, dan Kuta). Terapis bersertifikat, sopan, berpengalaman di hotel bintang 5, dan membawa seluruh perlengkapan spa lengkap."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "How quickly can an outcall massage therapist arrive at my villa in Bali?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Therapists typically arrive within 45 to 60 minutes after confirmation across all major Bali destinations including Seminyak, Canggu, Ubud, Uluwatu, Sanur, Nusa Dua, and Jimbaran."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Do therapists bring their own massage beds, fresh towels, and oils?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, our mobile therapists arrive fully equipped with portable professional massage beds or mattress setups, sanitized linens, fresh towels, relaxing ambient soundscapes, and 100% pure organic botanical massage oils."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "What massage treatments does Therapick offer in Bali?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Therapick offers Traditional Balinese Massage, Deep Tissue Recovery Massage, Couples Massage, Volcanic Hot Stone Massage, Foot Reflexology, Four Hands Massage, Prenatal Massage, and Organic Body Scrubs."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Are Therapick massage therapists certified and professional?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, 100% of our therapists are certified spa professionals with years of experience at 5-star international hotels and luxury resorts. All staff undergo rigorous background checks and continuous quality training. We strictly provide 100% professional non-sexual therapeutic massage."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "How much does home service or outcall massage cost in Bali?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Professional in-villa home service massage rates in Bali start from IDR 350,000 to IDR 800,000 per person depending on duration (60, 90, or 120 minutes) and treatment type, with no hidden transportation surcharges in primary service zones."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Can I book multiple therapists for couples or groups in our Bali villa?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, we specialize in simultaneous multi-therapist bookings for couples, families, and private villa retreat groups throughout Bali."
                          }
                        }
                      ]
                    }
                  ]
                }
                : {
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "WebSite",
                      "@id": `${url}/#website`,
                      "url": url,
                      "name": name,
                      "description": `Premier luxury massage home service and outcall in-villa spa dedicated exclusively to Ubud, Bali.`,
                      "inLanguage": "en-US"
                    },
                    {
                      "@type": ["DaySpa", "HealthAndBeautyBusiness", "LocalBusiness"],
                      "@id": `${url}/#spa`,
                      "name": `${name} | Massage Home Service & Outcall Spa Ubud`,
                      "alternateName": [
                        name,
                        `${name} Ubud`,
                        "Home Spa Ubud",
                        "Ubud Mobile Massage",
                        "Massage Home Service Ubud",
                        "Outcall Massage Ubud",
                        "Pijat Panggilan Ubud",
                        "Pijat Panggilan Gianyar",
                        "Spa Panggilan Ubud"
                      ],
                      "url": url,
                      "logo": `${url}${iconUrl}`,
                      "image": `${url}${iconUrl}`,
                      "description": `5-star luxury massage home service and outcall in-villa spa delivery exclusively serving Ubud, Bali. Certified Balinese therapists provide traditional Balinese, deep tissue, and couples massage directly to your private villa or resort in Ubud.`,
                      "knowsAbout": [
                        "Massage Home Service Ubud",
                        "Outcall Massage Ubud",
                        "In Villa Massage Ubud",
                        "Pijat Panggilan Ubud",
                        "Pijat Panggilan Gianyar",
                        "Traditional Balinese Massage Ubud",
                        "Deep Tissue Massage Ubud",
                        "Couples Massage Ubud"
                      ],
                      "telephone": "+6282266554600",
                      "priceRange": "$$",
                      "currenciesAccepted": "IDR, USD, AUD, EUR",
                      "paymentAccepted": "Cash, Credit Card, Bank Transfer, QRIS",
                      "address": {
                        "@type": "PostalAddress",
                        "streetAddress": "Jl. Raya Ubud No. 88",
                        "addressLocality": "Ubud",
                        "addressRegion": "Gianyar, Bali",
                        "postalCode": "80571",
                        "addressCountry": "ID"
                      },
                      "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": -8.5069,
                        "longitude": 115.2625
                      },
                      "openingHoursSpecification": [
                        {
                          "@type": "OpeningHoursSpecification",
                          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                          "opens": "08:00",
                          "closes": "23:00"
                        }
                      ],
                      "areaServed": [
                        { "@type": "Place", "name": "Ubud Center", "geo": { "@type": "GeoCoordinates", "latitude": -8.5069, "longitude": 115.2625 } },
                        { "@type": "Place", "name": "Sayan, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.4983, "longitude": 115.2427 } },
                        { "@type": "Place", "name": "Penestanan, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.5112, "longitude": 115.2505 } },
                        { "@type": "Place", "name": "Kedewatan, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.4833, "longitude": 115.2417 } },
                        { "@type": "Place", "name": "Campuhan, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.5031, "longitude": 115.2558 } },
                        { "@type": "Place", "name": "Tegallalang, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.4358, "longitude": 115.2789 } },
                        { "@type": "Place", "name": "Peliatan, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.5167, "longitude": 115.2750 } },
                        { "@type": "Place", "name": "Tebongkang, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.5361, "longitude": 115.2528 } },
                        { "@type": "Place", "name": "Lodtunduh, Ubud", "geo": { "@type": "GeoCoordinates", "latitude": -8.5444, "longitude": 115.2611 } },
                        { "@type": "AdministrativeArea", "name": "Ubud, Gianyar" }
                      ],
                      "hasOfferCatalog": {
                        "@type": "OfferCatalog",
                        "name": `${name} In-Villa Massage Home Service & Outcall Spa Treatments`,
                        "itemListElement": dynamicOfferCatalogItems || [
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Traditional Balinese Massage Ubud",
                              "serviceType": "Balinese Massage Home Service",
                              "description": "Authentic Balinese holistic healing massage delivered directly to private villas across Ubud, Bali."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Ubud Deep Tissue Muscle Recovery",
                              "serviceType": "Deep Tissue Outcall Massage",
                              "description": "Firm therapeutic in-villa massage relieving back, neck, and shoulder stiffness for travelers exploring Ubud."
                            }
                          },
                          {
                            "@type": "Offer",
                            "itemOffered": {
                              "@type": "Service",
                              "name": "Ubud Couples Massage Sanctuary",
                              "serviceType": "Couples Massage Home Service",
                              "description": "Bespoke side-by-side in-villa couples massage in Ubud villas with pure organic essential oils."
                            }
                          }
                        ]
                      }
                    },
                    {
                      "@type": "FAQPage",
                      "@id": `${url}/#faq`,
                      "mainEntity": [
                        {
                          "@type": "Question",
                          "name": `Can I book massage home service or outcall massage in Ubud with ${name}?`,
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Yes, ${name} delivers professional 5-star massage home service and outcall spa treatments directly to your private villa, resort, or hotel room anywhere in Ubud within 45-60 minutes.`
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Which areas in Ubud do you serve for outcall massage?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "We serve all areas in and around Ubud, including Ubud Center, Sayan, Penestanan, Kedewatan, Campuhan, Tegallalang, Peliatan, Tebongkang, and Lodtunduh."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "Apakah melayani pijat panggilan ke villa di Ubud?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Ya, kami melayani pijat panggilan profesional langsung ke villa pribadi dan hotel di seluruh Ubud. Terapis bersertifikat, higienis, dan membawa seluruh perlengkapan spa lengkap."
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "How quickly do therapists arrive in Ubud?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Our therapists typically arrive at your Ubud villa within 45-60 minutes from confirmation."
                          }
                        }
                      ]
                    }
                  ]
                }
            )
          }}
        />
      </head>

      <body
        data-domain={isTherapick ? "therapick" : (isBaliDomain ? "bali" : "ubud")}
        data-subdomain={isPartnersSubdomain ? "partners" : undefined}
        className={`${jakarta.variable} ${newsreader.variable} ${urbanist.variable} font-sans bg-transparent text-text min-h-screen selection:bg-primary selection:text-white`}
      >
        <SpaProvider brand={brand} initialData={initialData}>
          <CartProvider>
            <ScrollRevealProvider />
            <GlassThemeScope enabled={isTherapick && !isPartnersSubdomain} />
            {isTherapick && (
              <Suspense fallback={null}>
                <AffiliateTracker brand={brand} />
              </Suspense>
            )}
            <div className="flex flex-col min-h-screen w-full relative">
              {!isPartnersSubdomain && <TopNav />}
              <main className="flex-1 w-full max-w-[100vw]">
                {children}
              </main>
              {!isPartnersSubdomain && <Footer />}
            </div>
          </CartProvider>
        </SpaProvider>
      </body>
    </html>
  );
}
