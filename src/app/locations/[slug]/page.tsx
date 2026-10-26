import { Metadata } from 'next';
import { headers } from 'next/headers';
import LocationClient from '@/components/LocationClient';

type Props = {
    params: Promise<{ slug: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const locationName = slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    let host = 'www.booktherapick.com';
    try {
        const headersList = await headers();
        host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
    } catch {
        // fallback
    }

    const isTherapick = host.includes('booktherapick') || host.includes('therapick');
    const isBaliDomain = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
    const brandName = isTherapick ? 'Therapick' : (isBaliDomain ? 'Home Spa Ubud' : 'Elexoir Home Spa');
    const baseUrl = isTherapick 
        ? 'https://www.booktherapick.com' 
        : (isBaliDomain ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

    // Geo coordinates database for Bali regions
    const geoCoordinatesMap: Record<string, { lat: number; lng: number }> = {
        'ubud': { lat: -8.5069, lng: 115.2625 },
        'canggu': { lat: -8.6478, lng: 115.1385 },
        'seminyak': { lat: -8.6896, lng: 115.1686 },
        'uluwatu': { lat: -8.8149, lng: 115.0884 },
        'sanur': { lat: -8.7058, lng: 115.2625 },
        'nusa-dua': { lat: -8.7963, lng: 115.2191 },
        'jimbaran': { lat: -8.7725, lng: 115.1767 },
        'kuta': { lat: -8.7210, lng: 115.1698 },
    };

    const coords = geoCoordinatesMap[slug] || { lat: -8.4095, lng: 115.1889 };

    // For Elexoir and Home Spa Ubud, SEO is strictly restricted to Ubud
    const isUbud = slug === 'ubud';
    const isNonTherapickNonUbud = !isTherapick && !isUbud;

    const pageUrl = isNonTherapickNonUbud ? `${baseUrl}/locations/ubud` : `${baseUrl}/locations/${slug}`;
    const iconUrl = isTherapick ? '/therapick-logo.png' : (isBaliDomain ? '/homespa.png' : '/elexoir.png');

    const title = isTherapick
        ? `In-Villa Massage & Mobile Spa in ${locationName}, Bali | Therapick`
        : (isUbud 
            ? `${brandName} | Top-Rated Luxury Mobile Spa & In-Villa Massage in Ubud, Bali`
            : `Home Spa & In-Villa Massage in ${locationName} | ${brandName}`);

    const description = isTherapick
        ? `Book luxury in-villa massage and mobile spa services in ${locationName}, Bali with Therapick. 5-star certified therapists arrive at your private villa or hotel in 45-60 mins. Traditional Balinese, deep tissue, and couples massage.`
        : (isUbud
            ? `Experience 5-star luxury mobile spa and in-villa massage delivered directly to your villa, resort, or private residence anywhere in Ubud, Bali. Certified local therapists serving Ubud Center, Sayan, Penestanan, Kedewatan, and Tegallalang.`
            : `Looking for 5-star home spa and in-villa massage in ${locationName}, Bali? ${brandName} delivers professional certified massage therapists directly to your private villa.`);

    const keywords = isTherapick
        ? [
            `Massage ${locationName}`,
            `In Villa Massage ${locationName}`,
            `Mobile Spa ${locationName}`,
            `Home Spa ${locationName}`,
            `Best Massage in ${locationName}`,
            `Spa ${locationName} Bali`,
            `Couples Massage ${locationName}`,
            `Deep Tissue Massage ${locationName}`,
            `Traditional Balinese Massage ${locationName}`,
            `Massage Delivery ${locationName}`,
            `Hotel Massage ${locationName}`,
            `Therapist ${locationName} Bali`,
            `Therapick ${locationName}`,
            `Villa Massage ${locationName} Bali`
        ]
        : [
            `Home Spa Ubud`,
            `Mobile Spa Ubud`,
            `In Villa Massage Ubud`,
            `Massage Ubud Villa`,
            `Best Massage in Ubud`,
            `Ubud Home Spa`,
            `Couples Massage Ubud`,
            `Balinese Massage Ubud`,
            `Sayan Massage`,
            `Penestanan Spa`,
            `Kedewatan Mobile Massage`,
            `Tegallalang Villa Massage`,
            `${brandName} Ubud`
        ];

    return {
        title: title,
        description: description,
        keywords: keywords,
        icons: isTherapick
            ? {
                icon: [
                    { url: '/therapick-favicon.png', type: 'image/png' },
                    { url: '/therapick-favicon.png?v=3', type: 'image/png' },
                ],
                shortcut: [{ url: '/therapick-favicon.png', type: 'image/png' }],
                apple: [{ url: '/therapick-favicon.png', sizes: '180x180', type: 'image/png' }]
            }
            : {
                icon: [{ url: `${iconUrl}?v=2`, type: 'image/png' }],
                shortcut: [{ url: `${iconUrl}?v=2`, type: 'image/png' }],
                apple: [{ url: `${iconUrl}?v=2`, sizes: '180x180', type: 'image/png' }]
            },
        robots: isNonTherapickNonUbud 
            ? { index: false, follow: true } 
            : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
        openGraph: {
            title: title,
            description: description,
            url: pageUrl,
            siteName: brandName,
            locale: 'en_US',
            type: 'website',
            images: [
                {
                    url: iconUrl,
                    width: 800,
                    height: 800,
                    alt: `${brandName} ${locationName}`,
                }
            ]
        },
        alternates: {
            canonical: pageUrl,
        },
        other: {
            'geo.region': 'ID-BA',
            'geo.placename': `${locationName}, Bali, Indonesia`,
            'geo.position': `${coords.lat};${coords.lng}`,
            'ICBM': `${coords.lat}, ${coords.lng}`,
            'place:location:latitude': `${coords.lat}`,
            'place:location:longitude': `${coords.lng}`,
        }
    };
}

export function generateStaticParams() {
    return [
        { slug: 'ubud' },
        { slug: 'canggu' },
        { slug: 'seminyak' },
        { slug: 'uluwatu' },
        { slug: 'sanur' },
        { slug: 'nusa-dua' },
        { slug: 'jimbaran' },
        { slug: 'kuta' },
    ];
}

export default async function LocationPage({ params }: Props) {
    const { slug } = await params;
    const locationName = slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    let host = 'www.booktherapick.com';
    try {
        const headersList = await headers();
        host = headersList.get('host') || host;
    } catch {
        // fallback
    }

    const isTherapick = host.includes('booktherapick') || host.includes('therapick');
    const isBaliDomain = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
    const brandName = isTherapick ? 'Therapick' : (isBaliDomain ? 'Home Spa Ubud' : 'Elexoir Home Spa');
    const baseUrl = isTherapick 
        ? 'https://www.booktherapick.com' 
        : (isBaliDomain ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');
    const iconUrl = isTherapick ? '/therapick-logo-2.png' : (isBaliDomain ? '/homespa.png' : '/elexoir.png');

    const geoCoordinatesMap: Record<string, { lat: number; lng: number }> = {
        'ubud': { lat: -8.5069, lng: 115.2625 },
        'canggu': { lat: -8.6478, lng: 115.1385 },
        'seminyak': { lat: -8.6896, lng: 115.1686 },
        'uluwatu': { lat: -8.8149, lng: 115.0884 },
        'sanur': { lat: -8.7058, lng: 115.2625 },
        'nusa-dua': { lat: -8.7963, lng: 115.2191 },
        'jimbaran': { lat: -8.7725, lng: 115.1767 },
        'kuta': { lat: -8.7210, lng: 115.1698 },
    };

    const coords = geoCoordinatesMap[slug] || { lat: -8.4095, lng: 115.1889 };

    const schemaData = {
        "@context": "https://schema.org",
        "@type": ["DaySpa", "HealthAndBeautyBusiness", "LocalBusiness"],
        "name": `${brandName} - ${locationName}`,
        "url": `${baseUrl}/locations/${slug}`,
        "logo": `${baseUrl}${iconUrl}`,
        "image": `${baseUrl}${iconUrl}`,
        "description": `5-star luxury mobile spa and in-villa massage delivery in ${locationName}, Bali. Certified therapists arrive at your private villa or hotel with fresh linens, portable setup, and organic oils.`,
        "telephone": "+6282266554600",
        "priceRange": "$$",
        "currenciesAccepted": "IDR, USD, AUD, EUR, GBP, SGD",
        "paymentAccepted": "Cash, Credit Card, Visa, Mastercard, Bank Transfer, QRIS, Wise",
        "areaServed": {
            "@type": "Place",
            "name": `${locationName}, Bali`,
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": coords.lat,
                "longitude": coords.lng
            }
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": locationName,
            "addressRegion": "Bali",
            "addressCountry": "ID"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": coords.lat,
            "longitude": coords.lng
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "08:00",
                "closes": "23:30"
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <LocationClient locationName={locationName} locationSlug={slug} />
        </>
    );
}
