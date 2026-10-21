import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { SpaProvider } from "@/context/SpaContext";
import { CartProvider } from "@/context/CartContext";
import { headers } from "next/headers";
import { Suspense } from "react";
import AffiliateTracker from "@/components/AffiliateTracker";
import ScrollRevealProvider from "@/components/ScrollRevealProvider";

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

export async function generateViewport(): Promise<Viewport> {
  const headersList = await headers();
  const host = headersList.get("host") || "www.elexoirhomespaubud.com";
  const isBaliDomain = (host.includes("homespaubud") || host.includes("ubudhomespa")) && !host.includes("elexoir");

  return {
    themeColor: "#FFFFFF",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "www.elexoirhomespaubud.com";
  const isTherapick = host.includes("booktherapick") || host.includes("therapick");
  const isBaliDomain = (host.includes("homespaubud") || host.includes("ubudhomespa")) && !host.includes("elexoir");

  const name = isTherapick ? "Therapick" : (isBaliDomain ? "Home Spa Ubud" : "Elexoir Home Spa Ubud");
  const url = isTherapick ? "https://www.booktherapick.com" : (isBaliDomain ? "https://www.homespaubud.com" : "https://www.elexoirhomespaubud.com");
  
  const title = isTherapick 
    ? "Therapick | Island Relaxation, Delivered" 
    : (isBaliDomain 
      ? "Home Spa Ubud | Luxury Mobile Spa & In-Villa Massage in Bali" 
      : "Elexoir Home Spa | Premium Mobile Spa & Massage in Ubud, Bali");
      
  const description = isTherapick
    ? "Experience 5-star luxury home spa and in-villa massage delivered directly to your villa or hotel in Ubud, Canggu, Seminyak, Uluwatu, and across Bali with Therapick. Book certified therapists on-demand."
    : (isBaliDomain
      ? "Looking for the best massage in Bali? Home Spa Ubud delivers premium, 5-star professional spa treatments directly to your private villa or hotel. Serving Ubud, Canggu, Seminyak, Kuta, and Nusa Dua. Book now for ultimate relaxation!"
      : "Experience the top-rated luxury mobile spa in Bali. Professional in-villa massages, couples treatments & holistic rituals delivered directly to your hotel or villa in Ubud, Canggu, and Seminyak. Book your 5-star sanctuary with Elexoir today!");
      
  const iconUrl = isTherapick ? '/therapick-logo.png' : (isBaliDomain ? '/homespa.png' : '/elexoir.png');

  return {
    metadataBase: new URL(url),
    title: {
      default: title,
      template: `%s | ${name}`
    },
    description: description,
    keywords: [
      name,
      "Home Spa Ubud",
      "Mobile Spa Ubud",
      "In Villa Massage Ubud",
      "Massage Ubud Villa",
      "Ubud Home Spa",
      "Home Spa Bali",
      "Mobile Spa Bali",
      "In Villa Massage Bali",
      "Best Massage in Ubud",
      "Couples Massage Ubud",
      "Mobile Spa Canggu",
      "In Villa Massage Seminyak",
      "Mobile Spa Uluwatu",
      "Choose Massage Therapist Bali",
      "Book Available Therapist Bali",
      "On-Demand Massage Bali",
      "Bali Therapist Booking",
      "Professional Massage Bali",
      "Massage near me Bali",
      "Luxury Spa Delivery Bali"
    ],
    authors: [{ name: name }],
    creator: name,
    publisher: name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: iconUrl, type: 'image/png' }
      ],
      shortcut: [
        { url: iconUrl, type: 'image/png' }
      ],
      apple: [
        { url: iconUrl, type: 'image/png' }
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
      'geo.region': 'ID-BA',
      'geo.placename': 'Ubud, Bali, Indonesia',
      'geo.position': '-8.5069;115.2625',
      'ICBM': '-8.5069, 115.2625',
    }
  };
}


import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

// Cache SSR data for 120 seconds to avoid hitting Supabase on every request
const getSpaData = unstable_cache(
  async (brand: string) => {
    let treatments: any[] = [];
    let products: any[] = [];
    let campaigns: any[] = [];
    let therapists: any[] = [];

    try {
        let [treatmentsRes, productsRes, campaignsRes, therapistsRes] = await Promise.all([
          supabase.from('treatments').select('*').eq('is_published', true).eq('brand', brand).order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('is_published', true).eq('brand', brand).order('created_at', { ascending: false }),
          supabase.from('campaigns').select('*').eq('is_published', true).eq('brand', brand).order('created_at', { ascending: false }),
          supabase.from('therapists').select('*').eq('is_active', true).eq('brand', brand).order('created_at', { ascending: false })
        ]);

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
    } catch (error) {
      console.error("SSR error fetching spa data:", error);
    }

    return { treatments, products, campaigns, therapists };
  },
  ['spa-data'],
  { revalidate: 120, tags: ['spa-data'] }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "www.elexoirhomespaubud.com";
  const isTherapick = host.includes("booktherapick") || host.includes("therapick");
  const isBaliDomain = (host.includes("homespaubud") || host.includes("ubudhomespa")) && !host.includes("elexoir");
  const brand = isTherapick ? 'therapick' : (isBaliDomain ? 'bali' : 'elexoir');

  const name = isTherapick ? "Therapick" : (isBaliDomain ? "Home Spa Ubud" : "Elexoir Home Spa");
  const url = isTherapick ? "https://www.booktherapick.com" : (isBaliDomain ? "https://www.homespaubud.com" : "https://www.elexoirhomespaubud.com");
  const description = isTherapick
    ? "Experience 5-star luxury home spa and in-villa massage delivered directly to your villa or hotel in Ubud, Canggu, Seminyak, Uluwatu, and across Bali with Therapick. Book certified therapists on-demand."
    : (isBaliDomain
      ? "Looking for the best massage in Bali? Home Spa Ubud delivers premium, 5-star professional spa treatments directly to your private villa or hotel. Serving Ubud, Canggu, Seminyak, Kuta, and Nusa Dua."
      : "Experience the top-rated luxury mobile spa in Bali. Professional in-villa massages, couples treatments & holistic rituals delivered directly to your hotel or villa in Ubud, Canggu, and Seminyak.");
  const iconUrl = isTherapick ? '/therapick-logo.png' : (isBaliDomain ? '/homespa.png' : '/elexoir.png');

  // SSR Data Fetching with server-side caching (120s revalidation)
  const initialData = await getSpaData(brand);

  return (
    <html lang="en" className="antialiased scroll-smooth">
      <head>
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
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${url}/#website`,
                  "url": url,
                  "name": name,
                  "description": description,
                  "inLanguage": "en-US"
                },
                {
                  "@type": ["DaySpa", "HealthAndBeautyBusiness", "LocalBusiness"],
                  "@id": `${url}/#spa`,
                  "name": name,
                  "url": url,
                  "logo": `${url}${iconUrl}`,
                  "image": `${url}${iconUrl}`,
                  "description": description,
                  "telephone": "+6282266554600",
                  "priceRange": "$$",
                  "currenciesAccepted": "IDR, USD, AUD, EUR",
                  "paymentAccepted": "Cash, Credit Card, Bank Transfer, QRIS",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Jl. Raya Ubud",
                    "addressLocality": "Ubud",
                    "addressRegion": "Bali",
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
                      "dayOfWeek": [
                        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
                      ],
                      "opens": "08:00",
                      "closes": "23:00"
                    }
                  ],
                  "areaServed": [
                    { "@type": "City", "name": "Ubud" },
                    { "@type": "City", "name": "Canggu" },
                    { "@type": "City", "name": "Seminyak" },
                    { "@type": "City", "name": "Uluwatu" },
                    { "@type": "City", "name": "Sanur" },
                    { "@type": "City", "name": "Nusa Dua" },
                    { "@type": "City", "name": "Jimbaran" },
                    { "@type": "City", "name": "Kuta" },
                    { "@type": "AdministrativeArea", "name": "Bali" }
                  ],
                  "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Mobile Spa & In-Villa Massage Treatments",
                    "itemListElement": [
                      {
                        "@type": "Offer",
                        "itemOffered": {
                          "@type": "Service",
                          "name": "Traditional Balinese Massage",
                          "description": "5-star authentic Balinese in-villa massage delivered directly to your villa in Ubud and across Bali."
                        }
                      },
                      {
                        "@type": "Offer",
                        "itemOffered": {
                          "@type": "Service",
                          "name": "Deep Tissue Recovery Massage",
                          "description": "Firm therapeutic pressure targeting tension and fatigue delivered by certified mobile therapists."
                        }
                      },
                      {
                        "@type": "Offer",
                        "itemOffered": {
                          "@type": "Service",
                          "name": "Couples Massage Sanctuary Ritual",
                          "description": "Bespoke side-by-side in-villa couples massage experience with premium organic oils."
                        }
                      }
                    ]
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "5.0",
                    "reviewCount": "194",
                    "bestRating": "5",
                    "worstRating": "1"
                  }
                }
              ]
            })
          }}
        />
      </head>

      <body
        data-domain={isTherapick ? "therapick" : (isBaliDomain ? "bali" : "ubud")}
        className={`${jakarta.variable} ${newsreader.variable} font-sans bg-transparent text-text min-h-screen selection:bg-primary selection:text-white`}
      >
        <SpaProvider brand={brand} initialData={initialData}>
          <CartProvider>
            <ScrollRevealProvider />
            {isTherapick && (
              <Suspense fallback={null}>
                <AffiliateTracker brand={brand} />
              </Suspense>
            )}
            <div className="flex flex-col min-h-screen w-full relative">
              <TopNav />
              <main className="flex-1 w-full max-w-[100vw]">
                {children}
              </main>
              <Footer />
            </div>
          </CartProvider>
        </SpaProvider>
      </body>
    </html>
  );
}
