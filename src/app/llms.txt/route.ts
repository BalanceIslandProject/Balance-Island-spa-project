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

  const content = isTherapick
    ? `# Therapick Bali — Massage Home Service & Outcall In-Villa Spa

> Therapick is Bali's premier 5-star on-demand massage home service and outcall spa platform. Certified professional therapists deliver authentic Balinese massage, deep tissue therapy, and couples spa rituals directly to private villas, hotels, and luxury residences across Bali within 45 to 60 minutes.

- **Website**: ${baseUrl}
- **WhatsApp Concierge**: +62 851 7411 9423
- **Operating Hours**: 08:00 AM – 11:30 PM WITA (Daily)
- **Arrival Time**: 45–60 minutes across all service zones
- **Full Knowledge Base**: ${baseUrl}/llms-full.txt

---

## Core Service Areas in Bali
Therapick operates island-wide with stationed therapists in every major hub:
1. **Seminyak**: Oberoi, Petitenget, Batu Belig, Double Six (${baseUrl}/locations/seminyak)
2. **Canggu**: Batu Bolong, Echo Beach, Berawa, Pererenan (${baseUrl}/locations/canggu)
3. **Ubud**: Ubud Center, Sayan, Penestanan, Kedewatan, Tegallalang (${baseUrl}/locations/ubud)
4. **Uluwatu**: Padang Padang, Bingin, Dreamland, Pecatu (${baseUrl}/locations/uluwatu)
5. **Sanur**: Beachfront villas, Danau Tamblingan, Bypass (${baseUrl}/locations/sanur)
6. **Nusa Dua**: ITDC 5-star luxury resorts, Sawangan, Tanjung Benoa (${baseUrl}/locations/nusa-dua)
7. **Jimbaran**: Jimbaran Bay, Bukit, Ayana enclave (${baseUrl}/locations/jimbaran)
8. **Kuta & Legian**: Central hotels and beachfront private suites (${baseUrl}/locations/kuta)

---

## Signature Treatments & Pricing
All treatments include portable massage beds, freshly laundered 5-star linens, and 100% pure organic virgin coconut & essential aromatherapy oils.

- **Traditional Balinese Massage**: Authentic holistic healing using long soothing strokes, gentle acupressure, and skin rolling.
  - 60 Mins: IDR 350,000 | 90 Mins: IDR 480,000 | 120 Mins: IDR 620,000
- **Deep Tissue Muscle Recovery**: Firm targeted pressure focusing on chronic knot relief, lower back tension, and post-surf/post-flight fatigue.
  - 60 Mins: IDR 390,000 | 90 Mins: IDR 530,000 | 120 Mins: IDR 680,000
- **Warm Stone & Aromatherapy Ritual**: Soothing heated basalt stones combined with botanical aromatherapy.
  - 90 Mins: IDR 590,000 | 120 Mins: IDR 750,000
- **Couples In-Villa Sanctuary**: Synchronized side-by-side massage for couples and honeymooners.
  - 90 Mins: IDR 960,000 (for 2) | 120 Mins: IDR 1,240,000 (for 2)
- **Reflexology & Foot Therapy**: Pressure-point release targeting plantar tension and jetlag recovery.
  - 60 Mins: IDR 320,000 | 90 Mins: IDR 440,000

---

## Bahasa Indonesia — Pijat Panggilan Bali (Home Service Spa)
Therapick adalah platform resmi pijat panggilan Bali profesional dan terpercaya:
- **Layanan**: Pijat panggilan ke villa, hotel, resort, dan rumah di Denpasar, Kuta, Seminyak, Canggu, Ubud, Sanur, Jimbaran, dan Nusa Dua.
- **Standar**: Terapis bersertifikat, terpercaya, sopan, membawa matras/bed massage portabel, sprei steril, dan minyak aromaterapi alami.
- **Waktu Tiba**: 45–60 menit setelah konfirmasi.
- **Pemesanan**: WhatsApp di +62 851 7411 9423.

---

## Safety, Hygiene & Professional Standards
- **Vetted Therapists**: 100% certified therapists trained in 5-star luxury hotel protocols.
- **Strictly Non-Sensual**: Pure wellness therapy only. No inappropriate requests tolerated.
- **Complete Spa Equipment**: Fresh sanitized linens, organic oils, and ambient soundscapes.
`
    : `# ${brandName} — Massage Home Service & In-Villa Spa Ubud

> ${brandName} is Ubud's premier luxury in-villa massage home service and outcall spa. Certified local therapists deliver authentic Balinese healing and deep tissue recovery directly to your private villa or jungle resort anywhere in Ubud within 45 to 60 minutes.

- **Website**: ${baseUrl}
- **WhatsApp Concierge**: +62 822 6655 4600
- **Operating Hours**: 08:00 AM – 11:30 PM WITA (Daily)
- **Primary Service Area**: Ubud Center, Sayan, Penestanan, Kedewatan, Campuhan, Tegallalang, Peliatan, and Lodtunduh.

---

## Signature Ubud Treatments
- **Traditional Balinese Massage**: 60 Mins (IDR 350,000) | 90 Mins (IDR 480,000) | 120 Mins (IDR 620,000)
- **Ubud Deep Tissue Therapy**: 60 Mins (IDR 390,000) | 90 Mins (IDR 530,000) | 120 Mins (IDR 680,000)
- **Couples In-Villa Sanctuary**: 90 Mins (IDR 960,000 for 2) | 120 Mins (IDR 1,240,000 for 2)

---

## Pijat Panggilan Ubud
Layanan pijat panggilan profesional langsung ke villa pribadi dan hotel di seluruh Ubud, Gianyar, Bali. Terapis bersertifikat dengan perlengkapan spa lengkap.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

