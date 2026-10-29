
import { ServiceItem, Testimonial } from './types';

export const WHATSAPP_NUMBER = "6285174119423";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const GENERATE_WA_LINK = (serviceName?: string) => {
    const text = serviceName 
        ? `*ELEXOIR • RESERVATION REQUEST*
──────────────────────
Dear Concierge, I would like to book the *${serviceName}*.

*MY DETAILS*
👤 Name: 
📍 Location: 
🗓 Date: 
⏰ Time: 

──────────────────────
_Please confirm availability._`
        : `*ELEXOIR • CONCIERGE*
──────────────────────
Hello, I would like to inquire about your mobile spa services.

*MY DETAILS*
👤 Name: 
📍 Location: 
🗓 Date/Time: 
• Treatment: 

──────────────────────`;
    
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// Helper to parse duration and price strings into options
export const parseServiceOptions = (service: ServiceItem) => {
    const rawDurations = service.duration.split('/');
    const rawPrices = service.price.split('/');
    
    return rawDurations.map((d, index) => {
        let cleanDuration = d.trim().toUpperCase();
        if(!cleanDuration.includes('MIN') && !cleanDuration.includes('HR')) {
            cleanDuration += ' MINS';
        }
        
        let cleanPrice = rawPrices[index] ? rawPrices[index].trim() : 'On Request';
        if (index > 0 && !cleanPrice.startsWith('IDR')) {
             const firstPrice = rawPrices[0].trim();
             if (firstPrice.startsWith('IDR')) {
                 cleanPrice = 'IDR ' + cleanPrice;
             }
        }
        
        // Extract numeric value for calculation
        // Assumes format like "IDR 250k" -> 250000
        const numericString = cleanPrice.replace(/[^0-9]/g, '');
        const numericValue = numericString ? parseInt(numericString) * 1000 : 0;

        return {
            duration: cleanDuration,
            price: cleanPrice,
            numericValue: numericValue,
            label: `${cleanDuration} - ${cleanPrice}`
        };
    });
};

export const formatPrice = (amount: number) => {
    return `IDR ${amount.toLocaleString('en-ID')}`;
};

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Price List', path: '/prices' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const SERVICES: ServiceItem[] = [
  {
    id: 'balinese-massage',
    name: 'Balinese Massage',
    description: 'Experience the essence of authentic Balinese healing in the sanctuary of your private villa. Our signature full-body ritual employs a harmonious blend of long, rhythmic strokes, gentle stretching, and targeted palm pressure. Designed to restore the body\'s natural energy flow, this treatment is the perfect antidote to travel fatigue and jet lag. Benefits: Alleviates travel-induced stress, stimulates circulation, and cultivates profound physical and mental relaxation.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 250k / 375k / 500k',
    category: 'massage',
    image: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'aromatherapy-massage',
    name: 'Aromatherapy Massage',
    description: 'A deeply soothing sensory journey utilizing bespoke blends of premium essential oils, including frangipani, jasmine, and lemongrass. This gentle, restorative massage is meticulously crafted to calm the nervous system, alleviate anxiety, and promote restful sleep in your new surroundings. Your therapist will customize the aromatic profile to perfectly align with your current mood and needs. Benefits: Restores emotional equilibrium, induces deep tranquility, and supports natural detoxification.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 300k / 450k / 600k',
    category: 'massage',
    image: 'https://images.pexels.com/photos/6663595/pexels-photo-6663595.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'deep-tissue-massage',
    name: 'Deep Tissue Massage',
    description: 'An intensive, therapeutic massage designed to release chronic tension within the deeper layers of muscle and fascia. Utilizing firm, sustained pressure and slow strokes, this treatment is highly recommended for athletes, surfers, or those experiencing stiffness from prolonged desk work. We bring this essential recovery session directly to your door. Benefits: Alleviates severe muscle stiffness, aids in reducing inflammation, and significantly improves overall mobility.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 300k / 450k / 600k',
    category: 'massage',
    image: 'https://images.pexels.com/photos/3865562/pexels-photo-3865562.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'hot-stone-massage',
    name: 'Hot Stone Massage',
    description: 'A luxurious, deeply warming therapy that utilizes smooth, heated basalt stones to effortlessly melt away muscular tension. The penetrating heat expands blood vessels, encouraging blood flow throughout the body and allowing for deeper muscle relaxation without excessive pressure. An idyllic evening ritual to conclude a day of exploration. Benefits: Facilitates profound muscle relaxation, enhances sleep quality, and provides deep emotional grounding.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 350k / 525k / 700k',
    category: 'massage',
    image: 'https://images.pexels.com/photos/3997992/pexels-photo-3997992.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'reflexology-foot-massage',
    name: 'Reflexology Foot Massage',
    description: 'An ancient healing art that applies targeted pressure to specific reflex points on the feet, corresponding to the body\'s internal organs and systems. This therapeutic treatment is the ultimate remedy for revitalizing tired, aching legs after days of exploring Bali\'s landscapes. We transform your living space into a restorative foot sanctuary. Benefits: Stimulates optimal organ function, restores systemic balance, and provides immediate relief from foot and leg fatigue.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 250k / 375k / 500k',
    category: 'massage',
    image: 'https://images.pexels.com/photos/3997997/pexels-photo-3997997.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'thai-massage',
    name: 'Thai Massage',
    description: 'An invigorating, dynamic therapy that seamlessly blends assisted yoga postures, gentle rocking, and targeted acupressure. Performed fully clothed on a comfortable floor mat provided by our team, this \'lazy yoga\' treatment clears energy blockages and restores structural balance. Ideal for active individuals seeking enhanced physical performance. Benefits: Dramatically improves flexibility, unblocks vital energy pathways, and corrects postural imbalances.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 300k / 450k / 600k',
    category: 'massage',
    image: 'https://images.pexels.com/photos/3865676/pexels-photo-3865676.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'lomi-lomi-massage',
    name: 'Lomi Lomi Massage',
    description: 'Immerse yourself in the traditional Hawaiian \'loving hands\' massage, characterized by continuous, sweeping, wave-like strokes utilizing the therapist\'s forearms and hands. This deeply intuitive and nurturing practice works on both physical and energetic levels, washing away tension and leaving you in a state of blissful harmony. Benefits: Fosters emotional healing, stimulates lymphatic drainage, and restores profound spiritual balance.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 300k / 450k / 600k',
    category: 'massage',
    image: 'https://res.cloudinary.com/daxgquplr/image/upload/v1771931092/pexels-anntarazevich-6560304_sltlo0.jpg',
  },
  {
    id: 'four-hands-massage',
    name: 'Four Hands Massage',
    description: 'The pinnacle of spa luxury. Two highly skilled therapists work in perfect, synchronized harmony, mirroring each other\'s movements to create a mesmerizing choreography of touch. This extraordinary sensory experience overwhelms the mind\'s ability to focus on a single point, inducing an unparalleled state of deep relaxation. Benefits: Delivers a transcendent sensory experience, provides comprehensive muscle relief, and offers the ultimate in pure indulgence.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 500k / 750k / 950k',
    category: 'massage',
    image: 'https://res.cloudinary.com/daxgquplr/image/upload/v1771932791/pexels-gustavo-fring-5888077_dnrfzc.jpg',
  },
  {
    id: 'face-acupressure-massage',
    name: 'Face Acupressure Massage',
    description: 'A refined, therapeutic facial treatment that meticulously stimulates specific acupressure points across the face and neck. Designed to reduce travel-induced puffiness, enhance micro-circulation, and melt away jaw tension, this targeted therapy is the perfect enhancement to any full-body ritual. Benefits: Instantly relieves facial and jaw tension, boosts radiant circulation, and effectively alleviates sinus pressure and headaches.',
    duration: '30 / 60 mins',
    price: 'IDR 200k / 250k',
    category: 'massage',
    image: 'https://res.cloudinary.com/daxgquplr/image/upload/v1771930964/pexels-john-tekeridis-21837-3212179_nv7je5.jpg',
  },
  {
    id: 'head-neck-shoulder-massage',
    name: 'Head, Neck & Shoulder Massage',
    description: 'A highly focused, intensive treatment designed to eradicate the modern afflictions of \'tech neck\' and upper body stiffness. Perfect for digital nomads or those carrying the physical stress of travel, this therapy rapidly dissolves knots and restores mobility to your most tension-prone areas. Benefits: Effectively relieves tension headaches, drastically reduces upper-body stiffness, and immediately boosts mental clarity.',
    duration: '30 / 60 mins',
    price: 'IDR 200k / 300k',
    category: 'massage',
    image: 'https://res.cloudinary.com/daxgquplr/image/upload/v1771932342/pexels-cottonbro-3997989_log2d0.jpg',
  },
  {
    id: 'couple-massage',
    name: 'Couple Massage – Home Service',
    description: 'A beautifully curated, side-by-side Balinese Massage experience designed for two, performed in the intimate setting of your private villa. Complete with two professional therapists and a full luxury spa setup, this ritual is the perfect celebration of connection for honeymoons, anniversaries, or simply shared relaxation. Benefits: Cultivates shared tranquility, deepens emotional connection, and provides comprehensive physical rejuvenation.',
    duration: '60 / 90 / 120 mins',
    price: 'IDR 500k / 750k / 1,000k',
    category: 'packages',
    image: 'https://res.cloudinary.com/daxgquplr/image/upload/v1771931094/pexels-sergey-torbik-42706484-7365442_cmvxby.jpg',
  },
  {
    id: 'customised-spa-package',
    name: 'Customised Massage Package',
    description: 'The ultimate bespoke wellness journey. Design your perfect mobile spa session by seamlessly combining our premium treatments, such as a full-body massage paired with reflexology or a targeted head massage. An exceptional choice for solo retreat days, bridal preparations, or personalized pampering. Benefits: Delivers a fully personalized experience tailored to your exact physical and emotional needs, ensuring total, holistic body rejuvenation.',
    duration: '90 / 120 mins',
    price: 'IDR 450k / 625k',
    category: 'packages',
    image: 'https://res.cloudinary.com/daxgquplr/image/upload/v1771931094/pexels-anntarazevich-6560277_sf14ia.jpg',
  }
];

export const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Sarah J.", text: "The best massage I had in Bali! The therapist was so professional and came right to our villa in Seminyak. Pure bliss.", rating: 5 },
  { id: 2, name: "Emily R.", text: "Loved the easy booking via WhatsApp. The aromatherapy massage was heavenly after our long flight.", rating: 5 },
  { id: 3, name: "Jessica M.", text: "Highly recommend the deep tissue package. My muscles feel amazing! Best home massage service in Canggu.", rating: 5 },
  { id: 4, name: "Michael T.", text: "I'm a surfer and the Deep Tissue massage saved my back. The therapist knew exactly which muscles to target.", rating: 5 },
  { id: 5, name: "Chloe & Tom", text: "We booked the couples massage for our anniversary in Ubud. It was magical having the therapists come to us.", rating: 5 },
  { id: 6, name: "Amanda L.", text: "Very hygienic and professional. They brought everything including fresh sheets and music. Felt like a 5-star hotel.", rating: 5 },
  { id: 7, name: "David K.", text: "Fast response and great service. The hot stone massage was exactly what I needed to relax.", rating: 5 },
  { id: 8, name: "Sophie W.", text: "The facial acupressure added to my massage was a game changer. I felt totally relieved of stress!", rating: 5 },
  { id: 9, name: "James P.", text: "Reliable and on time. Hard to find good mobile massage in Uluwatu but Therapick delivered perfectly.", rating: 5 },
  { id: 10, name: "Rebecca H.", text: " booked a late night massage at 9pm. So grateful they offer evening appointments. Will book again!", rating: 5 },
];

export const SERVICE_AREAS = [
  "Seminyak", "Canggu", "Ubud", "Kuta", "Legian", "Jimbaran", "Nusa Dua", "Uluwatu", "Sanur", "All Bali Areas"
];

export const SPA_ADDONS = [
  { id: 'reflexology-30', title: 'Foot Reflexology', duration: '30 Mins', price: 150000 },
  { id: 'head-shoulder-30', title: 'Head, Neck & Shoulder', duration: '30 Mins', price: 150000 },
  { id: 'face-glow-30', title: 'Face Acupressure Glow', duration: '30 Mins', price: 150000 },
  { id: 'body-scrub-30', title: 'Balinese Herbal Body Scrub', duration: '30 Mins', price: 150000 },
  { id: 'aromatherapy-oil', title: 'Organic Essential Oil Upgrade', duration: 'Custom Blend', price: 50000 }
];
