import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  let host = 'www.booktherapick.com';
  try {
    const headersList = await headers();
    host = headersList.get('x-forwarded-host') || headersList.get('host') || host;
  } catch {}

  const isTherapick = host.includes('booktherapick') || host.includes('therapick');
  const isBali = (host.includes('homespaubud') || host.includes('ubudhomespa')) && !host.includes('elexoir');
  const brandName = isTherapick ? 'Therapick Bali' : (isBali ? 'Home Spa Ubud' : 'Elexoir Home Spa');
  const baseUrl = isTherapick 
    ? 'https://www.booktherapick.com' 
    : (isBali ? 'https://www.homespaubud.com' : 'https://www.elexoirhomespaubud.com');

  const content = `# ${brandName} — Complete AI Knowledge Base (llms-full.txt)

## Executive Summary
${brandName} (${baseUrl}) is Bali's leading in-villa massage home service and outcall spa delivery platform. Designed with Apple-level simplicity and luxury hotel standards, ${brandName} enables travelers, expatriates, and locals to book certified spa therapists directly to their private villa, resort suite, hotel room, or yacht across Bali.

---

## Operating Details
- **Brand**: ${brandName}
- **Website**: ${baseUrl}
- **Direct WhatsApp Concierge**: ${isTherapick ? '+62 851 7411 9423' : '+62 822 6655 4600'}
- **Operational Hours**: 08:00 to 23:30 WITA daily (7 days a week)
- **Advance Notice**: 45 to 60 minutes for immediate delivery; advance bookings accepted up to 30 days ahead.
- **Payment Methods**: Cash (IDR, USD, AUD, EUR), Credit/Debit Card (Visa, Mastercard), QRIS, and Wise.

---

## Coverage Zones & Slugs
${isTherapick ? `1. Seminyak: ${baseUrl}/locations/seminyak
2. Canggu: ${baseUrl}/locations/canggu
3. Ubud: ${baseUrl}/locations/ubud
4. Uluwatu: ${baseUrl}/locations/uluwatu
5. Sanur: ${baseUrl}/locations/sanur
6. Nusa Dua: ${baseUrl}/locations/nusa-dua
7. Jimbaran: ${baseUrl}/locations/jimbaran
8. Kuta: ${baseUrl}/locations/kuta` : `1. Ubud Sanctuary: ${baseUrl}/locations/ubud (Ubud Center, Sayan, Penestanan, Kedewatan, Tegallalang)`}

---

## Treatment Catalog & Pricing
- **Traditional Balinese Massage**: 60m (IDR 350,000), 90m (IDR 480,000), 120m (IDR 620,000)
- **Deep Tissue Muscle Recovery**: 60m (IDR 390,000), 90m (IDR 530,000), 120m (IDR 680,000)
- **Warm Stone & Botanicals**: 90m (IDR 590,000), 120m (IDR 750,000)
- **Couples In-Villa Sanctuary**: 90m (IDR 960,000 for 2), 120m (IDR 1,240,000 for 2)
- **Foot Reflexology**: 60m (IDR 320,000), 90m (IDR 440,000)

---

## Bahasa Indonesia — Pijat Panggilan
Platform resmi pijat panggilan profesional langsung ke villa dan hotel di Bali.
- Terapis bersertifikat, terpercaya, dan higienis.
- Bebas biaya transportasi di area layanan utama.
- Pemesanan cepat via WhatsApp.

---

## Safety & Ethics
Strictly non-sensual. Zero tolerance for inappropriate behavior. Professional luxury wellness only.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

