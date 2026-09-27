import React from 'react';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for PT BALANCE ISLAND INDONESIA and its brands.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-border/60">
        <h1 className="font-serif text-4xl text-primary mb-8">Terms of Service</h1>
        
        <div className="prose prose-sm md:prose-base text-text-muted space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          
          <h2 className="text-xl font-bold text-primary mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            These Terms of Service constitute a legally binding agreement made between you and PT BALANCE ISLAND INDONESIA, 
            concerning your access to and use of our website as well as any other media form, media channel, mobile website 
            or mobile application related, linked, or otherwise connected thereto.
          </p>

          <h2 className="text-xl font-bold text-primary mt-8 mb-4">2. Spa Bookings and Cancellations</h2>
          <p>
            When you book a treatment with us, you agree to our booking policies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>All bookings are subject to availability and confirmation.</li>
            <li>Cancellations made less than 24 hours before the scheduled appointment may incur a cancellation fee.</li>
            <li>We reserve the right to refuse service to anyone for any reason at any time.</li>
          </ul>

          <h2 className="text-xl font-bold text-primary mt-8 mb-4">3. Health and Safety</h2>
          <p>
            It is your responsibility to inform our therapists of any medical conditions, allergies, or physical ailments 
            before your treatment begins. PT BALANCE ISLAND INDONESIA and its therapists will not be held liable for any 
            adverse reactions or injuries resulting from undisclosed medical conditions.
          </p>

          <h2 className="text-xl font-bold text-primary mt-8 mb-4">4. Payment Terms</h2>
          <p>
            Payment for services can be made in cash, by credit card, or through other approved payment methods as 
            specified during the booking process. All prices are stated in Indonesian Rupiah (IDR) unless otherwise noted.
          </p>

          <h2 className="text-xl font-bold text-primary mt-8 mb-4">5. Governing Law</h2>
          <p>
            These Terms shall be governed by and defined following the laws of Indonesia. PT BALANCE ISLAND INDONESIA and 
            yourself irrevocably consent that the courts of Indonesia shall have exclusive jurisdiction to resolve any dispute 
            which may arise in connection with these terms.
          </p>
        </div>
      </div>
    </div>
  );
}
