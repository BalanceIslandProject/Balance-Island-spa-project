import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { SpaProvider } from "@/context/SpaContext";
import { headers } from "next/headers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
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
  const isBaliDomain = (host.includes("homespaubud") || host.includes("ubudhomespa")) && !host.includes("elexoir");

  const name = isBaliDomain ? "Ubud Home Spa" : "Elexoir Home Spa Ubud";
  const url = isBaliDomain ? "https://www.homespaubud.com" : "https://www.elexoirhomespaubud.com";
  const title = isBaliDomain ? "Ubud Home Spa | Luxury Mobile Spa" : "Elexoir Home Spa Ubud | Premium Mobile Spa & In-Villa Massage";
  const description = isBaliDomain
    ? "Looking for the best massage in Bali? We deliver premium, 5-star professional spa treatments directly to your private villa or hotel. Serving Seminyak, Canggu, Kuta, and Nusa Dua. Book now for ultimate relaxation!"
    : "Experience the top-rated luxury mobile spa in Bali. Professional in-villa massages, couples treatments & holistic rituals delivered directly to your hotel or villa in Ubud. Book your 5-star sanctuary today!";
  const iconUrl = isBaliDomain ? '/homespa.png' : '/elexoir.png';

  return {
    metadataBase: new URL(url),
    title: {
      default: title,
      template: `%s | ${name}`
    },
    description: description,
    keywords: [
      name, "Choose Massage Therapist Bali", "Book Available Therapist Bali",
      "On-Demand Massage Bali", "Mobile Spa Bali", "In Villa Massage Bali",
      "Bali Therapist Booking", "Professional Massage Bali", "Ubud Massage Therapist",
      "Canggu Massage Therapist", "Seminyak Massage Therapist", "Massage near me Bali"
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
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
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
      'geo.placename': 'Bali',
      'geo.position': '-8.4095;115.1889',
      'ICBM': '-8.4095, 115.1889',
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
        supabase.from('campaigns').select('*').eq('is_published', true).order('created_at', { ascending: false }),
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
  const isBaliDomain = (host.includes("homespaubud") || host.includes("ubudhomespa")) && !host.includes("elexoir");
  const brand = isBaliDomain ? 'bali' : 'elexoir';

  const name = isBaliDomain ? "Home Spa Ubud" : "Elexoir Home Spa";
  const url = isBaliDomain ? "https://www.homespaubud.com" : "https://www.elexoirhomespaubud.com";

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
              "@type": "WebSite",
              "name": name,
              "url": url,
            })
          }}
        />
      </head>

      <body
        data-domain={isBaliDomain ? "bali" : "ubud"}
        className={`${jakarta.variable} ${newsreader.variable} font-sans bg-transparent text-text min-h-screen selection:bg-primary selection:text-white`}
      >
        <SpaProvider brand={brand} initialData={initialData}>
          <div className="flex flex-col min-h-screen w-full relative">
            <TopNav />
            <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
              {children}
            </main>
            <Footer />
          </div>
        </SpaProvider>
      </body>
    </html>
  );
}
