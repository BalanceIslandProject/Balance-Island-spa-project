import { Metadata } from 'next';
import LocationClient from '@/components/LocationClient';

type Props = {
    params: Promise<{ slug: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const locationName = slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return {
        title: `Best Mobile Spa & Massage in ${locationName} | Therapick Bali`,
        description: `Looking for the best massage in ${locationName}? Therapick allows you to book premium professional massage therapists directly to your villa or hotel in ${locationName}, Bali.`,
        openGraph: {
            title: `Luxury Mobile Spa in ${locationName} | Therapick Bali`,
            description: `Find and book professional massage therapists in ${locationName}, Bali on-demand.`,
            url: `https://therapickbali.vercel.app/locations/${slug}`,
        },
        alternates: {
            canonical: `https://therapickbali.vercel.app/locations/${slug}`,
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
    
    return <LocationClient locationName={locationName} locationSlug={slug} />;
}
