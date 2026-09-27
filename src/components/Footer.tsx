import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1C1F1D] text-white py-10 mt-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-white/60 font-light tracking-wide">
            &copy; {currentYear} A brand of PT BALANCE ISLAND INDONESIA
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
