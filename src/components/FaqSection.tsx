'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useSpa } from '@/context/SpaContext';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { siteBrandFilter } = useSpa();
  const brandName = siteBrandFilter === 'therapick' ? 'Therapick' : siteBrandFilter === 'bali' ? 'Home Spa Ubud' : 'Elexoir Home Spa';

  const faqs = [
    {
      q: "What is the best home spa in Bali?",
      a: `We are highly rated as one of the best luxury mobile spas in Bali. ${brandName} specializes in bringing 5-star professional spa treatments, premium organic oils, and certified therapists directly to your private villa or hotel across the island.`
    },
    {
      q: "Do you provide massage services in Canggu and Seminyak?",
      a: "Yes, we offer premium mobile massage and spa services directly to your villa or hotel in Canggu, Seminyak, Umalas, and surrounding areas. Skip the Bali traffic and let our therapists bring the luxury spa experience to your doorstep."
    },
    {
      q: "Is in-villa massage available in Ubud?",
      a: siteBrandFilter === 'therapick'
        ? "Absolutely! Therapick delivers 5-star mobile massage directly to private villas and hotels across Ubud, Canggu, Seminyak, Uluwatu, Sanur, Nusa Dua, and all of Bali."
        : `Absolutely! Ubud is our sanctuary. Whether you are staying in a jungle resort or a private villa in Ubud, our mobile spa service delivers profound relaxation with authentic Balinese techniques.`
    },
    {
      q: "Do you offer couples massage?",
      a: "Our couples massage packages are our most popular service. Perfect for honeymooners and partners wanting to share a deeply relaxing, synchronized wellness experience without leaving the comfort of their accommodation."
    },
    {
      q: "Which massage is best after hiking Mount Batur or surfing?",
      a: "We highly recommend our Deep Tissue Massage or our specialized Back & Shoulder Massage. These treatments specifically target muscle tension, lactic acid buildup, and fatigue, ensuring a rapid and relaxing recovery after your Bali adventures."
    },
    {
      q: "Can therapists come to hotels and resorts in Nusa Dua or Uluwatu?",
      a: "Yes, our certified professional therapists can provide mobile massage services directly to your hotel room or private estate in Nusa Dua, Jimbaran, and Uluwatu. We operate seamlessly within Bali's top resorts to ensure utmost privacy."
    },
    {
      q: "What makes your mobile spa luxury?",
      a: "We recreate a premium spa environment in your space. We use luxurious 100% natural massage oils, bring fresh high-quality linens, soothing aromatherapy, and our therapists are rigorously trained in 5-star hospitality and advanced massage techniques."
    },
    {
      q: "How do I book a home spa treatment?",
      a: "Booking is simple and fast. Browse our treatments, select your duration and group size, and securely confirm your appointment instantly via WhatsApp with our concierge team. We even offer same-day booking depending on availability."
    },
    {
      q: "What types of massage are available?",
      a: "Our diverse menu includes Traditional Balinese Massage, Deep Tissue Massage, Aromatherapy, Reflexology, and specialized prenatal massages. Each treatment is tailored to your unique wellness needs."
    },
    {
      q: "Do I need to provide anything for the home spa session?",
      a: `Not at all. ${brandName} provides everything needed for a luxurious spa experience, including a professional massage bed, fresh high-quality linens, premium oils, and relaxing music. You only need to provide the space.`
    },
    {
      q: "Are your massage therapists certified?",
      a: `Yes, every therapist at ${brandName} is rigorously trained, fully certified, and possesses years of experience in 5-star luxury hotels and premium spa environments across Bali.`
    },
    {
      q: "Can I book a massage for my large group or retreat?",
      a: "Absolutely. We regularly cater to yoga retreats, bridal parties, and corporate events across Bali. We can deploy multiple therapists simultaneously to accommodate large groups in your villa."
    },
    {
      q: "What is your cancellation policy?",
      a: "We offer a flexible cancellation policy. You can cancel or reschedule your mobile spa appointment free of charge up to 4 hours before your scheduled treatment time."
    },
    {
      q: "Do you offer prenatal or pregnancy massage?",
      a: "Yes, we offer specialized prenatal massages performed by specifically trained therapists. This gentle treatment helps relieve lower back pain, reduces swelling, and promotes deep relaxation for mothers-to-be."
    },
    {
      q: "What areas of Bali do you cover?",
      a: "Our mobile massage therapists cover all major tourist and residential areas in Bali, including Ubud, Canggu, Seminyak, Legian, Kuta, Jimbaran, Nusa Dua, Sanur, and Uluwatu."
    },
    {
      q: "Is it safe to have a massage therapist come to my villa?",
      a: "Your safety and privacy are our highest priorities. All our therapists are thoroughly vetted, background-checked, and adhere to strict professional conduct and hygiene protocols."
    },
    {
      q: "Can I customize the pressure of my massage?",
      a: "Of course. Before your treatment begins, your therapist will consult with you regarding your preferred pressure—whether soft, medium, or strong firm pressure—and any specific areas you'd like them to focus on or avoid."
    },
    {
      q: "Do you use organic massage oils?",
      a: "Yes, we exclusively use premium, 100% natural, and organic massage oils. Our bespoke blends are designed to nourish the skin, soothe the senses, and enhance the overall therapeutic benefits of your massage."
    },
    {
      q: "How far in advance should I book?",
      a: "While we do our best to accommodate last-minute and same-day requests, we recommend booking at least 24 hours in advance to guarantee your preferred time slot and therapist."
    }
  ];

  return (
    <section className="mb-12 md:mb-24 scroll-reveal">
      <div className="w-full mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-3 block">FAQ</span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary leading-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3 md:space-y-4 scroll-reveal-stagger">
          {faqs.slice(0, showAll ? faqs.length : 5).map((faq, idx) => (
            <div 
              key={idx} 
              className={`bg-white border ${openIdx === idx ? 'border-primary/30 shadow-[0_10px_30px_rgb(0,0,0,0.04)]' : 'border-border/50'} rounded-3xl overflow-hidden transition-all duration-300`}
            >
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 md:p-10 text-left focus:outline-none"
              >
                <h3 className="font-bold text-base md:text-lg text-primary pr-6 md:pr-8">{faq.q}</h3>
                <div className={`w-8 h-8 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-300 ${openIdx === idx ? 'bg-primary text-white border-primary' : 'bg-surface text-primary border-border'}`}>
                  {openIdx === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 md:px-10 pb-6 md:pb-10 pt-0">
                      <p className="text-base md:text-lg text-text-muted font-normal leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {!showAll && faqs.length > 5 && (
          <div className="mt-8 md:mt-12 flex justify-center">
            <button 
              onClick={() => setShowAll(true)}
              className="inline-flex items-center justify-center bg-white border border-border/80 text-primary px-8 py-3.5 rounded-full text-sm font-bold tracking-wider hover:bg-gray-50 hover:shadow-md transition-all duration-300"
            >
              SEE MORE FAQS
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
