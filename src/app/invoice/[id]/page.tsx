'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCart, BookingHistory } from '@/context/CartContext';
import { CheckCircle2, ChevronLeft, User, Calendar, Clock, MapPin, DoorOpen, Download, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';

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

            const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id || '');
            const targetId = decodeURIComponent(rawId).trim();

            // 1. Try to fetch from Supabase bookings table using case-insensitive reference number or id
            try {
                let { data, error } = await supabase
                    .from('bookings')
                    .select('*')
                    .ilike('reference_number', targetId)
                    .maybeSingle();

                if (!data && targetId.includes('-')) {
                    const idRes = await supabase
                        .from('bookings')
                        .select('*')
                        .eq('id', targetId)
                        .maybeSingle();
                    data = idRes.data;
                }

                if (data) {
                    // Map the Supabase row back to BookingHistory format
                    setBooking({
                        id: data.reference_number || targetId,
                        date: data.created_at || new Date().toISOString(),
                        status: data.status?.toLowerCase() || 'confirmed',
                        items: Array.isArray(data.items) && data.items.length > 0 ? data.items : [
                            {
                                id: 'item-1',
                                treatmentId: 'treatment-1',
                                title: data.treatment_name || 'Signature Ritual',
                                duration: '60',
                                price: data.total_price || data.revenue || 0,
                                guests: data.pax || 1
                            }
                        ],
                        totalPrice: data.total_price || data.revenue || 0,
                        customerDetails: {
                            name: data.guest_name || '',
                            date: data.booking_date || '',
                            time: data.time || data.booking_time || '',
                            location: data.location || '',
                            room: data.room_number || ''
                        }
                    });
                    setIsLoading(false);
                    return;
                }

                // 2. Fallback to affiliate_commissions if booking was an affiliate record
                const { data: comm } = await supabase
                    .from('affiliate_commissions')
                    .select('*')
                    .ilike('booking_id', targetId)
                    .maybeSingle();

                if (comm) {
                    const gross = Number(comm.booking_amount_gross || comm.eligible_treatment_amount || 0);
                    setBooking({
                        id: comm.booking_id || targetId,
                        date: comm.created_at || new Date().toISOString(),
                        status: comm.service_completed ? 'confirmed' : 'confirmed',
                        items: [
                            {
                                id: 'item-1',
                                treatmentId: 'treatment-1',
                                title: comm.treatment_name || 'Signature Ritual',
                                duration: '60',
                                price: gross,
                                guests: 1
                            }
                        ],
                        totalPrice: gross,
                        customerDetails: {
                            name: comm.customer_name || 'Guest',
                            date: comm.booking_date || (comm.created_at ? comm.created_at.split('T')[0] : ''),
                            time: comm.booking_time || '14:00',
                            location: comm.location || 'Villa',
                            room: comm.room_number || ''
                        }
                    });
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error fetching invoice from supabase:", err);
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
            const found = history.find(h => h.id === params.id);
            if (found) {
                setBooking(found);
            }
            setIsLoading(false);
        };

        fetchInvoice();
    }, [params, history, searchParams]);

    if (isLoading) {
        return <div className="min-h-[100dvh] bg-[#FDFBF7]" />; // Invisible fast loading
    }

    if (!booking) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#FDFBF7]">
                <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-soft border border-border">
                    <h2 className="font-serif text-xl text-primary mb-3">Invoice Unavailable</h2>
                    <p className="text-text-muted text-sm mb-6">
                        This invoice is stored securely on the device where it was created. 
                        If you are viewing this inside an app like WhatsApp, please tap the menu (•••) and select <strong>"Open in Safari / Chrome"</strong>.
                    </p>
                    <button onClick={() => router.push('/')} className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-secondary/30 pt-20 pb-24 px-4 sm:px-6">
                <style dangerouslySetInnerHTML={{__html: `
                    footer, .floating-nav, #floating-nav, .mobile-nav { display: none !important; }
                `}} />

            <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-soft-lg overflow-hidden border border-border/80 relative">
                
                {/* Header Pattern */}
                <div className="h-2 bg-primary w-full"></div>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center text-center mb-8 pb-8 border-b border-border/50 border-dashed">
                        {booking.status?.toLowerCase() === 'cancelled' ? (
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <XCircle size={24} />
                            </div>
                        ) : booking.status?.toLowerCase() === 'pending' ? (
                            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                                <Clock size={24} />
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={24} />
                            </div>
                        )}
                        <h1 className="font-serif text-2xl text-primary font-medium tracking-wide mb-1 uppercase">BOOKING {booking.status || 'CONFIRMED'}</h1>
                        <p className="text-text-muted text-sm max-w-[250px] mb-4">
                            {booking.status?.toLowerCase() === 'cancelled' ? 'Your booking has been cancelled.' :
                             booking.status?.toLowerCase() === 'pending' ? 'Your booking is pending confirmation.' :
                             'Your booking has been received and confirmed.'}
                        </p>
                        
                        <div className="bg-black/5 text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg">
                            {booking.id.toUpperCase().substring(0, 10)}
                        </div>
                    </div>

                    {/* Service Provider */}
                    {(() => {
                        const partnerItem = booking.items.find((i: any) => i.isPartner || i.partnerName);
                        if (partnerItem) {
                            return (
                                <div className="mb-8 bg-[#F8F9FA] rounded-2xl p-5 border border-border/60 text-center">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full inline-block mb-3">
                                        Verified Partner Spa Reservation
                                    </span>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Service Provider &amp; Venue</p>
                                    {partnerItem.partnerLogoUrl ? (
                                        <img
                                            src={partnerItem.partnerLogoUrl}
                                            alt={partnerItem.partnerName || 'Partner Spa'}
                                            className="w-14 h-14 rounded-2xl object-cover border border-gray-200 bg-white mx-auto mb-2.5 shadow-xs"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-lg mx-auto mb-2.5 shadow-xs">
                                            {partnerItem.partnerName?.charAt(0) || 'P'}
                                        </div>
                                    )}
                                    <h2 className="font-serif text-xl text-primary font-bold tracking-tight">
                                        {partnerItem.partnerName}
                                    </h2>
                                    {partnerItem.partnerLocation && (
                                        <p className="text-xs text-text-muted mt-1.5 flex items-center justify-center gap-1.5 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            {partnerItem.partnerLocation}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-3 pt-2.5 border-t border-border/40 font-mono">
                                        Official Booking Verified &amp; Facilitated by PT BALANCE ISLAND INDONESIA
                                    </p>
                                </div>
                            );
                        }

                        return (
                            <div className="mb-8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 text-center">Service Provider</p>
                                <h2 className="text-center font-serif text-lg text-primary font-medium tracking-wide">PT BALANCE ISLAND INDONESIA</h2>
                            </div>
                        );
                    })()}

                    {/* Guest Details */}
                    {(() => {
                        const partnerItem = booking.items.find((i: any) => i.isPartner || i.partnerName);
                        return (
                            <div className="mb-8 bg-[#F8F9FA] rounded-2xl p-5 border border-border/40">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 border-b border-border/50 pb-2">
                                    {partnerItem ? 'Guest & Venue Details' : 'Guest Details'}
                                </h3>
                                <div className={`grid ${partnerItem ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3'} gap-3 sm:gap-5 items-center`}>
                                    <div className="flex flex-col gap-5 overflow-hidden">
                                        <div className="w-full">
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><User className="w-3 h-3"/> Name</span>
                                            <span className="text-sm text-primary font-medium block truncate" title={booking.customerDetails.name}>{booking.customerDetails.name}</span>
                                        </div>
                                        <div>
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><Calendar className="w-3 h-3"/> Date</span>
                                            <span className="text-sm text-primary font-medium whitespace-nowrap">{booking.customerDetails.date}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center text-center border-x border-border/50 px-2 h-full py-2">
                                        <span className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2"><Clock className="w-3 h-3"/> Time</span>
                                        <span className="text-xl sm:text-2xl text-primary font-serif font-medium">{booking.customerDetails.time}</span>
                                    </div>

                                    <div className="flex flex-col gap-5">
                                        <div>
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><MapPin className="w-3 h-3"/> {partnerItem ? 'Venue' : 'Location'}</span>
                                            <span className="text-sm text-primary font-medium line-clamp-2 leading-tight">
                                                {partnerItem ? (partnerItem.partnerName || booking.customerDetails.location) : booking.customerDetails.location}
                                            </span>
                                        </div>
                                        {!partnerItem && booking.customerDetails.room && (
                                            <div>
                                                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><DoorOpen className="w-3 h-3"/> Room</span>
                                                <span className="text-sm text-primary font-medium line-clamp-1">{booking.customerDetails.room}</span>
                                            </div>
                                        )}
                                        {partnerItem && booking.customerDetails.location && (
                                            <div>
                                                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1"><User className="w-3 h-3"/> Staying At</span>
                                                <span className="text-xs text-primary font-medium line-clamp-1">{booking.customerDetails.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Treatments */}
                    <div className="mb-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Treatments</h3>
                        <div className="space-y-3">
                            {booking.items.map(item => (
                                <div key={item.id} className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0">
                                    <div className="pr-4">
                                        <p className="text-xs font-bold text-primary mb-1 leading-tight">{item.title}</p>
                                        <p className="text-[10px] text-text-muted">{item.guests} {item.guests > 1 ? 'Guests' : 'Guest'} • {String(item.duration).replace(/mins?/i, '').trim()} Mins</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-serif font-medium text-primary leading-tight">
                                            IDR {(() => {
                                            const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                                            const multiplier = isCouple ? (item.guests / 2) : item.guests;
                                            return (item.price * multiplier).toLocaleString('en-US');
                                        })()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Breakdown (for Partner Spas or Discounted bookings) */}
                    {(() => {
                        let publishedTotal = 0;
                        let discountTotal = 0;
                        let subtotalTotal = 0;
                        let taxTotal = 0;
                        let hasPartnerBreakdown = false;
                        let discountRate = 0;
                        let taxRate = 0;

                        booking.items.forEach((item: any) => {
                            const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                            const multiplier = isCouple ? Math.max(1, Math.round(item.guests / 2)) : (item.guests || 1);
                            if (item.publishedPrice) {
                                hasPartnerBreakdown = true;
                                publishedTotal += (item.publishedPrice || 0);
                                discountTotal += (item.discountAmount || 0);
                                subtotalTotal += (item.subtotal || (item.publishedPrice - item.discountAmount));
                                taxTotal += (item.taxAmount || 0);
                                if (item.discountPercentage) discountRate = item.discountPercentage;
                                if (item.taxPercentage) taxRate = item.taxPercentage;
                            } else if (item.isPartner) {
                                hasPartnerBreakdown = true;
                                const unitPrice = item.price || 0;
                                const disc = Number(item.discountPercentage) || 5;
                                const tax = Number(item.taxPercentage) || 17.5;
                                discountRate = disc;
                                taxRate = tax;
                                const sub = tax > 0 ? Math.round(unitPrice / (1 + tax / 100)) : unitPrice;
                                const pub = disc > 0 ? Math.round(sub / (1 - disc / 100)) : sub;
                                publishedTotal += pub * multiplier;
                                discountTotal += (pub - sub) * multiplier;
                                subtotalTotal += sub * multiplier;
                                taxTotal += (unitPrice - sub) * multiplier;
                            }
                        });

                        if (!hasPartnerBreakdown) return null;

                        return (
                            <div className="rounded-2xl bg-[#F8F9FA] p-4 border border-border/60 mb-6 space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted pb-1.5 border-b border-border/40">
                                    <span>Rate Breakdown</span>
                                    <span>Amount</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Published Rate</span>
                                    <span className="font-medium text-primary">IDR {publishedTotal.toLocaleString('en-US')}</span>
                                </div>
                                {discountTotal > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-600 font-medium">
                                        <span>Partner Discount ({discountRate}%)</span>
                                        <span>−IDR {discountTotal.toLocaleString('en-US')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-primary font-medium pt-1 border-t border-border/30">
                                    <span>Subtotal</span>
                                    <span>IDR {subtotalTotal.toLocaleString('en-US')}</span>
                                </div>
                                {taxTotal > 0 && (
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Tax &amp; Service Charge ({taxRate}%)</span>
                                        <span className="font-medium text-primary">+IDR {taxTotal.toLocaleString('en-US')}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t border-border/80 mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Total Paid</span>
                        <span className="text-xl font-serif font-medium text-primary">
                            IDR {booking.totalPrice.toLocaleString('en-US')}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => window.print()}
                            className="w-full flex items-center justify-center gap-2 bg-surface text-primary border border-border px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm hover:bg-black/5 transition-colors tracking-widest uppercase"
                        >
                            <Download size={14} /> Download PDF
                        </button>
                        <Link 
                            href="/"
                            className="w-full flex items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors py-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            <ChevronLeft size={12} /> Return Home
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function InvoicePageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] bg-[#FDFBF7]" />}>
            <InvoicePage />
        </Suspense>
    );
}
