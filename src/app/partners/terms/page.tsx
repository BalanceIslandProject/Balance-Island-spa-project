import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Partner Program Policy & Agreement | Therapick Bali',
  description: 'Official Partner Program Policy & Agreement for approved Therapick referral partners in Bali.',
};

export default function PartnerTermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8 text-neutral-900">
      
      {/* Top Navigation Back Link */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 pb-4">
        <Link
          href="/partners"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Partner Portal</span>
        </Link>
        <span className="text-[11px] font-mono text-neutral-400">Version 1.0 • Published</span>
      </div>

      {/* Document Header */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/70">
            <ShieldCheck size={13} className="text-neutral-900" />
            <span>Official Policy & Legal Agreement</span>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Effective Date: Upon Publication</span>
        </div>

        <div className="space-y-1.5 pt-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-950 tracking-tight font-medium">
            Therapick Partner Program Policy & Agreement
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 italic">
            Brand tagline: Island Relaxation, Delivered &bull; Website: <a href="https://www.booktherapick.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-black">https://www.booktherapick.com</a>
          </p>
        </div>

        {/* Quick Summary Callout */}
        <div className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-4 sm:p-5 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="font-bold text-neutral-900 block mb-0.5">15% Commission</span>
            <span className="text-neutral-500">Calculated on net eligible treatment price after discounts.</span>
          </div>
          <div>
            <span className="font-bold text-neutral-900 block mb-0.5">7-Day Attribution</span>
            <span className="text-neutral-500">Last-touch attribution anchored 7 days from referral scan.</span>
          </div>
          <div>
            <span className="font-bold text-neutral-900 block mb-0.5">Verified Payouts</span>
            <span className="text-neutral-500">Earned upon service completion & payment verification.</span>
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-2xs space-y-10 text-xs sm:text-sm leading-relaxed text-neutral-700">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight flex items-center gap-2">
            <span>1. About the Partner Program</span>
          </h2>
          <p>
            Therapick partners with hotels, villas, travel agencies, tour guides, private drivers, concierges, and other approved businesses to introduce customers to our professional home spa and massage services in Bali.
          </p>
          <p>
            Our goal is to provide customers with a convenient way to enjoy professional treatments at their accommodation while rewarding partners for eligible referrals.
          </p>
          <p>
            Partners can participate by sharing their unique referral link, QR code, or other approved promotional materials. Participation in the program means that the partner agrees to follow this policy.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            2. Partner Eligibility
          </h2>
          <p>
            The program is open to individuals and businesses that can legitimately refer customers to Therapick, including:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Hotels and resorts.</li>
            <li>Villas and villa management companies.</li>
            <li>Hotel and villa concierges.</li>
            <li>Private drivers and transportation providers.</li>
            <li>Tour guides and tour operators.</li>
            <li>Travel agencies and travel planners.</li>
            <li>Other businesses approved by Therapick.</li>
          </ul>
          <p>
            Partners must provide accurate registration and payout information and comply with applicable laws and the policies of their own employer or business.
          </p>
          <p>
            Employees must obtain any permissions required by their employer before receiving referral commissions. Therapick does not authorize undisclosed payments that violate a partner’s employment obligations or hotel, villa, or agency policies.
          </p>
          <p>
            Therapick reserves the right to approve, decline, suspend, or terminate a partnership in accordance with this policy.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            3. Commission Structure
          </h2>
          <p>
            The standard partner commission is <strong>15%</strong> of eligible treatment revenue from qualifying referrals.
          </p>
          <p>Commission is earned only when all of the following conditions are satisfied:</p>
          <ol className="list-decimal pl-5 space-y-1 text-neutral-600">
            <li>The booking is validly attributed to the partner.</li>
            <li>The treatment has been completed.</li>
            <li>Payment has been received and verified by Therapick.</li>
            <li>The booking has not been cancelled, refunded, or identified as fraudulent.</li>
            <li>The booking complies with this policy.</li>
          </ol>
          <h3 className="font-bold text-neutral-900 pt-2">Commission Calculation</h3>
          <p>
            Unless otherwise agreed in writing, commission is calculated on the final eligible treatment price after applicable discounts. The following are excluded from commission calculations unless Therapick explicitly agrees otherwise:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Cancelled or refunded amounts.</li>
            <li>Tips and gratuities.</li>
            <li>Separate transportation or other surcharges.</li>
            <li>Other amounts that do not represent eligible treatment revenue.</li>
          </ul>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 mt-2 space-y-1 text-xs">
            <span className="font-bold text-neutral-900 block">Calculation Example:</span>
            <p className="text-neutral-600">
              A customer books a treatment for IDR 375,000, with no discount or excluded charges:
            </p>
            <ul className="list-disc pl-5 text-neutral-600">
              <li>Eligible treatment revenue: IDR 375,000</li>
              <li>Partner commission rate: 15%</li>
              <li>Partner commission: IDR 56,250</li>
            </ul>
          </div>
          <p className="text-xs text-neutral-500">
            Partners must not calculate or promise commissions using a different rate unless an authorized written agreement specifies otherwise.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            4. Referral Links, QR Codes & Attribution
          </h2>
          <p>
            Each approved partner receives a unique referral identifier, referral link, or QR code. Partners must use their own assigned referral materials and must not use another partner’s identifier or manipulate referral tracking.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <h3 className="font-bold text-neutral-900">4.1 Seven-day referral window</h3>
              <p className="text-neutral-600">
                Therapick uses a seven-day referral tracking window. When a customer opens a valid partner referral link or scans a partner QR code, the website records the referral where technically possible and permitted by applicable privacy requirements. The referral remains eligible for tracking for up to seven days from the latest valid referral interaction.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-neutral-900">4.2 Last eligible referral for new bookings</h3>
              <p className="text-neutral-600">
                For new bookings, Therapick uses a last-eligible-referral model. If a customer first visits through Partner A and subsequently opens Partner B’s valid referral link before creating a new booking, Partner B receives credit for that new booking. The later referral does not automatically change the attribution of a booking that has already been created.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-neutral-900">4.3 Direct visits</h3>
              <p className="text-neutral-600">
                If a customer returns to the website directly without using another referral link, the previously recorded referral remains active until it expires. A direct website visit alone does not replace a valid referral.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-neutral-900">4.4 Existing bookings</h3>
              <p className="text-neutral-600">
                Once a booking has been created and assigned to a partner, its attribution is locked. A later referral from another partner cannot take commission away from the original partner for that existing booking. Authorized administrative corrections may be made to resolve genuine tracking errors, but they must be documented and auditable.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-neutral-900">4.5 Repeat bookings</h3>
              <p className="text-neutral-600">
                A seven-day cookie does not guarantee lifetime commission on a customer. A subsequent booking qualifies for commission if it is independently and validly attributed under the referral rules in effect when that booking is created.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-neutral-900">4.6 Tracking limitations</h3>
              <p className="text-neutral-600">
                Referral attribution may fail when a customer uses another device or browser, clears cookies, blocks tracking, or books through an unmatched channel. Therapick may review verifiable booking records to resolve legitimate attribution disputes.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            5. Booking Process
          </h2>
          <p>
            Customers may book through the Therapick website and its existing WhatsApp booking process. Partners should direct customers to the official website or share their assigned referral link or QR code.
          </p>
          <p>
            Partners must not create false bookings, duplicate customer inquiries, or bookings without the customer’s knowledge. Therapick’s authorized team remains responsible for confirming availability, treatment details, pricing, therapist assignments, and booking acceptance.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            6. Commission Status & Payment
          </h2>
          <p>Commissions follow the status of the underlying booking:</p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li><strong>Pending:</strong> The booking has been recorded but is not yet eligible for payment.</li>
            <li><strong>Eligible:</strong> The treatment is completed and payment is verified.</li>
            <li><strong>Processing:</strong> The commission has been included in an approved payout process.</li>
            <li><strong>Paid:</strong> The payout has been completed.</li>
            <li><strong>Reversed or cancelled:</strong> The commission is no longer payable or has been adjusted because of a cancellation, refund, or other valid correction.</li>
          </ul>
          <p>
            Therapick maintains commission records in its administrative system. Payout arrangements and bank transfer schedules are accessible through the partner dashboard.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            7. Cancellation, Refunds & Disputes
          </h2>
          <p>
            No commission is payable on a booking that is cancelled before the treatment is completed. If a customer receives a full refund, the commission will ordinarily be reversed. If a partial refund is issued, commission may be recalculated against remaining eligible treatment revenue.
          </p>
        </section>

        {/* Section 8 & 9 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            8. Partner Conduct & 9. Prohibited Activities
          </h2>
          <p>
            Partners must represent Therapick honestly and professionally. Partners must never offer or advertise sexual services, illegal activities, spam messaging, or unapproved medical claims. Generating fake bookings, manipulating tracking cookies, or unauthorized customer data collection is strictly prohibited and subject to immediate partnership termination and commission forfeiture.
          </p>
        </section>

        {/* Section 10 - 15 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            10. Privacy, Branding, Relationship & Updates
          </h2>
          <p>
            Partners participate as independent referral partners. Partners are not employees, general agents, or legal representatives of Therapick. Customer privacy and data protection must be strictly respected. Therapick may update this policy with prospective effect as operational and legal standards require.
          </p>
        </section>

        {/* Acknowledgment Footer Box */}
        <div className="border-t border-neutral-200/80 pt-6 mt-8 space-y-4">
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-5 space-y-2">
            <span className="font-serif text-base font-semibold text-neutral-950 block">
              Partner Acknowledgment
            </span>
            <p className="text-xs text-neutral-600 leading-relaxed">
              By joining or continuing to participate in the Therapick Partner Program, the partner confirms that they have read and understood the program rules, including the 15% commission structure, seven-day referral tracking window, last-eligible-referral model for new bookings, booking attribution rules, payout conditions, and prohibited activities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href="/partners/register"
              className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold tracking-wide transition-colors"
            >
              Continue to Registration
            </Link>
            <span className="text-[11px] text-neutral-400">
              Official Website: https://www.booktherapick.com
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
