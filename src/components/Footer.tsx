import React from 'react';
import Link from 'next/link';
import { Store, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1C1F1D] text-white pt-20 pb-10 rounded-t-[40px] mt-10 border-t border-border/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Intro */}
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group outline-none">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                <Store size={20} strokeWidth={2} />
              </div>
              <span className="font-serif text-xl font-medium tracking-wide domain-ubud-only">Elexoir Home Spa</span>
              <span className="font-serif text-xl font-medium tracking-wide domain-bali-only">Home Spa Ubud</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed font-light mb-6">
              Bali's premier luxury mobile spa. Bringing 5-star professional massages and organic wellness treatments directly to your private villa or hotel.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/elexoirspa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white hover:text-primary transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/rituals" className="text-sm text-white/70 hover:text-white transition-colors">Treatments</Link></li>
              <li><Link href="/store" className="text-sm text-white/70 hover:text-white transition-colors">Spa Store</Link></li>
              <li><Link href="/contact" className="text-sm text-white/70 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Top Services */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">Top Services</h4>
            <ul className="space-y-4">
              <li><Link href="/rituals" className="text-sm text-white/70 hover:text-white transition-colors">Balinese Massage</Link></li>
              <li><Link href="/rituals" className="text-sm text-white/70 hover:text-white transition-colors">Deep Tissue Massage</Link></li>
              <li><Link href="/rituals" className="text-sm text-white/70 hover:text-white transition-colors">Couples Massage</Link></li>
              <li><Link href="/rituals" className="text-sm text-white/70 hover:text-white transition-colors">Foot Reflexology</Link></li>
              <li><Link href="/rituals" className="text-sm text-white/70 hover:text-white transition-colors">Spa Packages</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">Contact & Locations</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                <span className="text-sm text-white/70 font-light">+62 851-7411-9423</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                <span className="text-sm text-white/70 font-light domain-ubud-only">hello@elexoirhomespaubud.com</span>
                <span className="text-sm text-white/70 font-light domain-bali-only">hello@homespaubud.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                <span className="text-sm text-white/70 font-light leading-relaxed">
                  Available in Ubud, Canggu, Seminyak, Uluwatu, Sanur, Nusa Dua & Jimbaran.
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-white/60 font-light tracking-wide domain-ubud-only">
              &copy; {currentYear} Elexoir Home Spa &middot; A brand of PT BALANCE ISLAND INDONESIA
            </p>
            <p className="text-sm text-white/60 font-light tracking-wide domain-bali-only">
              &copy; {currentYear} Home Spa Ubud &middot; A brand of PT BALANCE ISLAND INDONESIA
            </p>
            <div className="flex gap-6 mt-4 md:ml-[4.5rem]">
              <Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
