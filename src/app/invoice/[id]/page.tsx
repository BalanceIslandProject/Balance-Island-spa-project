'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCart, BookingHistory } from '@/context/CartContext';
import { 
  CheckCircle2, 
  ChevronLeft, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  DoorOpen, 
  Download, 
  XCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { StatusPill } from '@/components/therapick/TherapickUI';

function InvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { history } = useCart();
  const [booking, setBooking] = useState<BookingHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params?.id) {
        setIsLoading(false);
        return;
      }

      // 1. Try to fetch from Supabase first using reference_number
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('reference_number', params.id)
          .single();

        if (data && !error) {
          // Map the Supabase row back to BookingHistory format
          setBooking({
            id: data.reference_number,
            date: data.created_at || new Date().toISOString(),
            status: data.status?.toLowerCase() || 'confirmed',
            items: Array.isArray(data.items) ? data.items : [],
            totalPrice: data.total_price || data.revenue || 0,
            customerDetails: {
              name: data.guest_name || '',
              date: data.booking_date || '',
              time: data.time || data.booking_time || '',
              location: data.location || '',
              room: data.room_number || '',
            },
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching from supabase', err);
      }

      // 2. Fallback to 'd' URL parameter
      const dataParam = searchParams.get('d');
      if (dataParam) {
        try {
          const decoded = JSON.parse(atob(decodeURIComponent(dataParam)));
          setBooking(decoded);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Failed to decode invoice data', e);
        }
      }

      // 3. Fallback to local history
      const found = history.find((h) => h.id === params.id);
      if (found) {
        setBooking(found);
      }
      setIsLoading(false);
    };

    fetchInvoice();
  }, [params, history, searchParams]);

  if (isLoading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#FAFAFA] font-sans text-[#171717]">
        <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center border border-[#E5E5E5] shadow-xs space-y-4">
          <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto text-[#737373]">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="font-serif text-xl text-black font-medium tracking-tight mb-1">
              Invoice Unavailable
            </h2>
            <p className="text-[#737373] text-xs leading-relaxed">
              This invoice is stored securely on the device where it was created. If you are viewing this inside an in-app browser like WhatsApp, please tap (•••) and select <strong>&quot;Open in Safari / Chrome&quot;</strong>.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full h-11 bg-black text-white hover:bg-[#262626] rounded-xl font-medium text-xs tracking-wide transition-colors"
          >
            Return to Therapick
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status?.toLowerCase() === 'cancelled';
  const isPending = booking.status?.toLowerCase() === 'pending';

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-12 sm:pt-20 pb-20 px-4 sm:px-6 font-sans text-[#171717] antialiased">
      <style
        dangerouslySetInnerHTML={{
          __html: `footer, .floating-nav, #floating-nav, .mobile-nav { display: none !important; }`,
        }}
      />

      <div className="max-w-lg mx-auto bg-white rounded-2xl overflow-hidden border border-[#E5E5E5] shadow-xs relative">
        
        {/* Subtle Brand Accent Bar */}
        <div className="h-1 bg-black w-full" />

        <div className="p-5 sm:p-8 space-y-6">
          
          {/* Header Status & Reference */}
          <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-[#E5E5E5] space-y-3">
            <div className="flex items-center justify-center">
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>

            <div className="space-y-1">
              <StatusPill
                status={booking.status || 'confirmed'}
                label={isCancelled ? 'Booking Cancelled' : isPending ? 'Pending Confirmation' : 'Booking Confirmed'}
              />
              <h1 className="font-serif text-2xl sm:text-3xl text-black font-medium tracking-tight pt-1">
                {isCancelled ? 'Booking Cancelled' : isPending ? 'Appointment Pending' : 'Booking Confirmation'}
              </h1>
              <p className="text-xs text-[#737373] max-w-xs mx-auto">
                {isCancelled
                  ? 'Your appointment has been cancelled.'
                  : isPending
                  ? 'Your appointment has been registered and is awaiting final therapist assignment.'
                  : 'Your mobile spa appointment has been received and confirmed.'}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F5F5F5] border border-[#E5E5E5] text-xs font-mono text-black">
              <span className="text-[#737373]">Ref:</span>
              <span className="font-semibold">{booking.id.toUpperCase().substring(0, 10)}</span>
            </div>
          </div>

          {/* Service Provider Legal Info */}
          <div className="text-center space-y-0.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#737373] block">
              Service Provider
            </span>
            <p className="font-serif text-sm font-medium text-black">
              PT BALANCE ISLAND INDONESIA
            </p>
            <p className="text-[11px] text-[#A3A3A3]">Therapick Mobile Spa Bali</p>
          </div>

          {/* Guest Details Summary Card */}
          <div className="bg-[#FAFAFA] rounded-xl p-4 sm:p-5 border border-[#E5E5E5] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black">
                Guest Logistics
              </span>
              <span className="text-[10px] text-[#737373] font-mono">In-Villa Delivery</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-0.5">
                <span className="flex items-center gap-1 text-[10px] text-[#737373] uppercase tracking-wide">
                  <User size={12} /> Guest Name
                </span>
                <span className="font-medium text-black block truncate" title={booking.customerDetails.name}>
                  {booking.customerDetails.name || 'Valued Guest'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="flex items-center gap-1 text-[10px] text-[#737373] uppercase tracking-wide">
                  <Calendar size={12} /> Schedule
                </span>
                <span className="font-medium text-black block">
                  {booking.customerDetails.date} • {booking.customerDetails.time}
                </span>
              </div>

              <div className="col-span-2 space-y-0.5 pt-1 border-t border-[#E5E5E5]">
                <span className="flex items-center gap-1 text-[10px] text-[#737373] uppercase tracking-wide">
                  <MapPin size={12} /> Villa / Hotel Location
                </span>
                <span className="font-medium text-black block leading-relaxed">
                  {booking.customerDetails.location}
                  {booking.customerDetails.room && ` (${booking.customerDetails.room})`}
                </span>
              </div>
            </div>
          </div>

          {/* Treatments Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black">
                Treatments Selected
              </span>
              <span className="text-[11px] font-mono text-[#737373]">{booking.items.length} items</span>
            </div>

            <div className="divide-y divide-[#E5E5E5]">
              {booking.items.map((item) => {
                const isCouple = ['couple', 'honeymoon'].some((k) =>
                  item.title.toLowerCase().includes(k)
                );
                const multiplier = isCouple ? item.guests / 2 : item.guests;
                const lineTotal = item.price * multiplier;

                return (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-black leading-snug truncate">{item.title}</p>
                      <p className="text-[11px] text-[#737373] mt-0.5">
                        {item.guests} {item.guests > 1 ? 'Guests' : 'Guest'} • {item.duration} Mins
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-medium text-black">
                        IDR {lineTotal.toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex justify-between items-baseline pt-4 border-t border-[#E5E5E5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-black">
              Total Amount
            </span>
            <span className="text-xl font-mono font-semibold text-black">
              IDR {booking.totalPrice.toLocaleString('en-US')}
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full h-11 flex items-center justify-center gap-2 bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download / Print Receipt</span>
            </button>
            <Link
              href="/"
              className="w-full h-10 flex items-center justify-center gap-1.5 text-[#737373] hover:text-black transition-colors text-xs font-medium"
            >
              <ChevronLeft size={14} />
              <span>Return to BookTherapick.com</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function InvoicePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <InvoicePage />
    </Suspense>
  );
}
