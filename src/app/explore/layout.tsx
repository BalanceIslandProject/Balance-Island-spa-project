import { Metadata } from 'next';
import { headers } from 'next/headers';

type Props = {
    children: React.ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
    let host = 'www.booktherapick.com';
    try {
        const headersList = await headers();
        host = headersList.get('host') || host;
    } catch {}

    const isTherapick = host.includes('booktherapick') || host.includes('therapick');
    const isBaliDomain = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
    const brandName = isTherapick ? 'Therapick' : (isBaliDomain ? 'Home Spa Ubud' : 'Elexoir Home Spa');
    const baseUrl = isTherapick 
        ? 'https://www.booktherapick.com' 
        : (isBaliDomain ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');
    const iconUrl = isTherapick ? '/therapick-logo-2.png' : (isBaliDomain ? '/homespa.png' : '/elexoir.png');

    const title = isTherapick 
        ? 'All Spa Treatments & In-Villa Massage Packages Bali | Therapick'
        : `Spa Treatments & In-Villa Massage Menu Ubud | ${brandName}`;

    const description = isTherapick
        ? 'Explore and book 5-star mobile spa treatments and in-villa massage packages across Bali with Therapick. Traditional Balinese, deep tissue, hot stone, and bespoke couples sanctuary rituals delivered to your villa in 45-60 mins.'
        : `Explore 5-star luxury mobile spa treatments and in-villa massage packages in Ubud, Bali. Authentic Balinese therapies, deep tissue recovery, and couples rituals delivered to your private villa in Ubud by ${brandName}.`;

    const keywords = isTherapick
        ? [
            'Spa Treatments Bali',
            'In Villa Massage Packages Bali',
            'Bali Spa Menu',
            'Balinese Massage Bali',
            'Deep Tissue Massage Bali',
            'Couples Massage Bali',
            'Hot Stone Massage Bali',
            'Book Massage Bali',
            'Therapick Treatments',
            'Mobile Spa Menu Bali'
        ]
        : [
            'Ubud Spa Menu',
            'In Villa Massage Ubud Packages',
            'Ubud Massage Treatments',
            'Balinese Massage Ubud',
            'Ubud Deep Tissue Massage',
            'Couples Massage Ubud Menu',
            `${brandName} Treatments`
        ];

    const geoPlacename = isTherapick ? 'Bali, Indonesia' : 'Ubud, Gianyar, Bali, Indonesia';
    const coords = isTherapick ? '-8.4095;115.1889' : '-8.5069;115.2625';
    const icbm = isTherapick ? '-8.4095, 115.1889' : '-8.5069, 115.2625';

    return {
        title: title,
        description: description,
        keywords: keywords,
        openGraph: {
            title: title,
            description: description,
            url: `${baseUrl}/explore`,
            siteName: brandName,
            locale: 'en_US',
            type: 'website',
            images: [
                {
                    url: iconUrl,
                    width: 800,
                    height: 800,
                    alt: `${brandName} Treatments`,
                }
            ]
        },
        alternates: {
            canonical: `${baseUrl}/explore`,
        },
        other: {
            'geo.region': 'ID-BA',
            'geo.placename': geoPlacename,
            'geo.position': coords,
            'ICBM': icbm,
        }
    };
}

export default function ExploreLayout({ children }: Props) {
    return <>{children}</>;
}
