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

    const title = `Home Spa & In-Villa Massage in ${locationName} | ${brandName}`;
    const description = `Looking for 5-star home spa and in-villa massage in ${locationName}, Bali? ${brandName} delivers professional certified massage therapists directly to your private villa or hotel. Book traditional Balinese, deep tissue, and couples massage.`;
    const pageUrl = `${baseUrl}/locations/${slug}`;
    const iconUrl = isTherapick ? '/therapick-logo.png' : (isBaliDomain ? '/homespa.png' : '/elexoir.png');

    return {
        title: title,
        description: description,
        keywords: [
            `Home Spa ${locationName}`,
            `Mobile Spa ${locationName}`,
            `In Villa Massage ${locationName}`,
            `Massage ${locationName} Bali`,
            `Best Massage in ${locationName}`,
            `Couples Massage ${locationName}`,
            `Spa Delivery ${locationName}`,
            `${brandName} ${locationName}`,
            `Massage Therapist ${locationName}`
        ],
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
            'geo.position': slug === 'ubud' ? '-8.5069;115.2625' : '-8.4095;115.1889',
            'ICBM': slug === 'ubud' ? '-8.5069, 115.2625' : '-8.4095, 115.1889',
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

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "DaySpa",
        "name": `${brandName} - ${locationName}`,
        "url": `${baseUrl}/locations/${slug}`,
        "description": `5-star luxury mobile spa and in-villa massage delivery in ${locationName}, Bali.`,
        "telephone": "+6282266554600",
        "priceRange": "$$",
        "areaServed": {
            "@type": "Place",
            "name": `${locationName}, Bali`
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": locationName,
            "addressRegion": "Bali",
            "addressCountry": "ID"
        }
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
