import React from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import FaqSection from '@/components/FaqSection';

export async function generateMetadata(): Promise<Metadata> {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const isBaliDomain = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
  const brandName = isTherapick ? 'Therapick' : (isBaliDomain ? 'Home Spa Ubud' : 'Elexoir Home Spa');
  const baseUrl = isTherapick
    ? 'https://www.booktherapick.com'
    : (isBaliDomain ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

  const title = `Frequently Asked Questions | Massage Home Service & Outcall Spa Bali | ${brandName}`;
  const description = `All your questions answered about booking 5-star massage home service, outcall in-villa spa, and pijat panggilan in Bali. Coverage areas, arrival times, hygiene standards, and treatments.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/faq`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/faq`,
      siteName: brandName,
      type: 'website',
    },
  };
}

export default async function FaqPage() {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const baseUrl = isTherapick ? 'https://www.booktherapick.com' : 'https://www.homespaubud.com';
  const brandName = isTherapick ? 'Therapick Bali' : 'Home Spa Ubud';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/faq#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'FAQ',
            item: `${baseUrl}/faq`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${baseUrl}/faq#webpage`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is the best massage home service and outcall spa in Bali?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${brandName} is highly rated as Bali's premier luxury massage home service and outcall spa platform, delivering 5-star certified therapists, portable massage beds, fresh sanitized linens, and organic oils directly to your villa or hotel within 45 to 60 minutes.`,
            },
          },
          {
            '@type': 'Question',
            name: `How does outcall massage and massage home service work in Bali?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Our certified therapists bring the complete spa sanctuary to your private villa or hotel suite across Seminyak, Canggu, Ubud, Uluwatu, Sanur, and Nusa Dua. All equipment including portable beds, sterile linens, and organic oils are provided.`,
            },
          },
          {
            '@type': 'Question',
            name: `Apakah melayani pijat panggilan ke hotel dan villa di Bali?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Ya, kami melayani pijat panggilan profesional langsung ke hotel, resort, dan villa di seluruh Bali (Seminyak, Canggu, Ubud, Uluwatu, Sanur, Jimbaran, Nusa Dua, dan Denpasar). Terapis bersertifikat, higienis, membawa perlengkapan spa lengkap, dan pemesanan mudah via WhatsApp.`,
            },
          },
          {
            '@type': 'Question',
            name: `How far in advance do I need to book?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `We accept immediate on-demand bookings with therapists typically arriving in 45 to 60 minutes, as well as advance scheduled bookings up to 30 days ahead.`,
            },
          },
          {
            '@type': 'Question',
            name: `What types of treatments are available for home service?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `We offer Traditional Balinese Massage, Deep Tissue Muscle Recovery, Warm Stone Aromatherapy, Couples In-Villa Sanctuary, and Foot Reflexology.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="min-h-screen bg-white pt-32 pb-24 font-sans px-6">
        <div className="max-w-7xl mx-auto">
          <FaqSection />
        </div>
      </div>
    </>
  );
}
