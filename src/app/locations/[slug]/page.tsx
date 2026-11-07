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
        ? `Massage Home Service & Outcall Massage ${locationName}, Bali | Therapick`
        : (isUbud 
            ? `${brandName} | Massage Home Service & Outcall Spa in Ubud, Bali`
            : `Massage Home Service & Outcall Spa in ${locationName} | ${brandName}`);

    const description = isTherapick
        ? `Professional massage home service and outcall massage in ${locationName}, Bali with Therapick. 5-star certified therapists arrive at your private villa or hotel within 45-60 mins. Pijat panggilan ${locationName} profesional, Balinese massage, deep tissue & couples rituals.`
        : (isUbud
            ? `Experience top-rated massage home service and outcall spa in Ubud, Bali. 5-star certified therapists deliver authentic Balinese healing, deep tissue recovery, and couples spa rituals directly to your private villa anywhere in Ubud.`
            : `Looking for 5-star massage home service and outcall massage in ${locationName}, Bali? ${brandName} delivers certified professional therapists directly to your private villa.`);

    const keywords = isTherapick
        ? [
            `massage home service ${slug}`,
            `massage home service ${locationName.toLowerCase()}`,
            `outcall massage ${slug}`,
            `outcall massage ${locationName.toLowerCase()}`,
            `home massage ${slug}`,
            `home massage ${locationName.toLowerCase()}`,
            `home service massage ${slug}`,
            `home service massage ${locationName.toLowerCase()}`,
            `in villa massage ${slug}`,
            `in villa massage ${locationName.toLowerCase()}`,
            `pijat panggilan ${slug}`,
            `pijat panggilan ${locationName.toLowerCase()}`,
            `massage panggilan ${slug}`,
            `spa panggilan ${slug}`,
            `pijat panggilan ${slug} 24 jam`,
            `massage ${slug} bali`,
            `spa ${locationName.toLowerCase()} bali`,
            `best massage in ${locationName.toLowerCase()}`,
            `couples massage ${locationName.toLowerCase()}`,
            `deep tissue massage ${locationName.toLowerCase()}`,
            `traditional balinese massage ${locationName.toLowerCase()}`,
            `hotel massage ${locationName.toLowerCase()}`,
            `therapick ${slug}`,
            `villa massage ${locationName.toLowerCase()} bali`
        ]
        : [
            `massage home service ubud`,
            `outcall massage ubud`,
            `home massage ubud`,
            `home service massage ubud`,
            `in villa massage ubud`,
            `pijat panggilan ubud`,
            `pijat panggilan gianyar`,
            `massage panggilan ubud`,
            `spa panggilan ubud`,
            `home spa ubud`,
            `couples massage ubud`,
            `balinese massage ubud`,
            `sayan massage`,
            `penestanan spa`,
            `kedewatan mobile massage`,
            `tegallalang villa massage`,
            `${brandName} ubud`
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
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "@id": `${baseUrl}/locations/${slug}#breadcrumb`,
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": baseUrl
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Service Areas",
                        "item": `${baseUrl}/service-areas`
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": `${locationName} Massage Home Service`,
                        "item": `${baseUrl}/locations/${slug}`
                    }
                ]
            },
            {
                "@type": ["DaySpa", "HealthAndBeautyBusiness", "LocalBusiness"],
                "@id": `${baseUrl}/locations/${slug}#business`,
                "name": `${brandName} ${locationName} - Massage Home Service & Outcall Spa`,
                "alternateName": [
                    `Therapick Massage Home Service ${locationName}`,
                    `Outcall Massage ${locationName}`,
                    `Home Massage ${locationName}`,
                    `Pijat Panggilan ${locationName}`,
                    `In Villa Massage ${locationName}`
                ],
                "url": `${baseUrl}/locations/${slug}`,
                "logo": `${baseUrl}${iconUrl}`,
                "image": `${baseUrl}${iconUrl}`,
                "description": `5-star certified massage home service and outcall spa in ${locationName}, Bali. Professional therapists arrive at your private villa or hotel within 45-60 minutes with fresh linens, portable setup, and organic oils. Pijat panggilan ${locationName} profesional.`,
                "telephone": "+6282266554600",
                "priceRange": "$$",
                "currenciesAccepted": "IDR, USD, AUD, EUR, GBP, SGD",
                "paymentAccepted": "Cash, Credit Card, Visa, Mastercard, Bank Transfer, QRIS, Wise",
                "knowsAbout": [
                    `Massage Home Service ${locationName}`,
                    `Outcall Massage ${locationName}`,
                    `Home Massage ${locationName}`,
                    `In Villa Massage ${locationName}`,
                    `Pijat Panggilan ${locationName}`,
                    `Pijat Panggilan Bali`,
                    `Balinese Massage ${locationName}`,
                    `Deep Tissue Massage ${locationName}`,
                    `Couples Massage ${locationName}`
                ],
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
            },
            {
                "@type": "Service",
                "@id": `${baseUrl}/locations/${slug}#service`,
                "name": `Massage Home Service & Outcall Spa in ${locationName}`,
                "serviceType": "In-Villa Massage & Outcall Spa Service",
                "provider": {
                    "@id": `${baseUrl}/locations/${slug}#business`
                },
                "areaServed": {
                    "@type": "Place",
                    "name": `${locationName}, Bali`
                },
                "description": `Luxury in-villa massage and mobile spa delivery across ${locationName}, Bali. Certified therapists arrive at your private villa or hotel within 45-60 minutes.`,
                "offers": {
                    "@type": "Offer",
                    "priceCurrency": "IDR",
                    "availability": "https://schema.org/InStock"
                }
            },
            {
                "@type": "FAQPage",
                "@id": `${baseUrl}/locations/${slug}#faq`,
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": `Can I book massage home service or outcall massage in ${locationName} with ${brandName}?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Yes, ${brandName} provides professional 5-star massage home service and outcall spa treatments directly to your private villa, resort, or hotel room in ${locationName}, Bali within 45-60 minutes.`
                        }
                    },
                    {
                        "@type": "Question",
                        "name": `How quickly do massage therapists arrive at villas in ${locationName}?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Our certified therapists typically arrive at your villa or hotel in ${locationName} within 45 to 60 minutes after booking confirmation, bringing complete professional spa equipment including sanitized linens and organic oils.`
                        }
                    },
                    {
                        "@type": "Question",
                        "name": `Apakah melayani pijat panggilan ke hotel atau villa di ${locationName}?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Ya, kami melayani pijat panggilan profesional langsung ke hotel, resort, dan villa di seluruh area ${locationName}. Terapis bersertifikat kami tiba tepat waktu dengan perlengkapan spa lengkap dan higienis.`
                        }
                    }
                ]
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
