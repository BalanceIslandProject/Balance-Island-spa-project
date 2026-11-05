'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCart, BookingHistory } from '@/context/CartContext';
import { CheckCircle2, ChevronLeft, User, Calendar, Clock, MapPin, DoorOpen, Download, Loader2, XCircle, Building2, X } from 'lucide-react';
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
    const [selectedTreatmentModal, setSelectedTreatmentModal] = useState<any | null>(null);
    const [treatmentDetails, setTreatmentDetails] = useState<any | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    // Fetch treatment details when "View Details" is clicked
    useEffect(() => {
        if (!selectedTreatmentModal) {
            setTreatmentDetails(null);
            return;
        }
        const fetchDetails = async () => {
            setIsDetailsLoading(true);
            try {
                const rawTitle = selectedTreatmentModal.title
                    .replace(/\s*[·•-]\s*Jaens\s*Spa.*$/i, '')
                    .replace(/\s*[·•-].*$/, '')
                    .trim();

                // 1. Try partner_treatments
                let { data: pt } = await supabase
                    .from('partner_treatments')
                    .select('*')
                    .or(`id.eq.${selectedTreatmentModal.treatmentId || '00000000-0000-0000-0000-000000000000'},title.ilike.%${rawTitle}%`)
                    .maybeSingle();

                if (pt) {
                    setTreatmentDetails(pt);
                    setIsDetailsLoading(false);
                    return;
                }

                // 2. Try standard treatments
                let { data: t } = await supabase
                    .from('treatments')
                    .select('*')
                    .or(`id.eq.${selectedTreatmentModal.treatmentId || '00000000-0000-0000-0000-000000000000'},title.ilike.%${rawTitle}%`)
                    .maybeSingle();

                if (t) {
                    setTreatmentDetails(t);
                } else {
                    setTreatmentDetails({
                        title: rawTitle,
                        desc: 'Premium holistic wellness ritual delivered by certified spa therapists.',
                        options: [{ duration: selectedTreatmentModal.duration, price: selectedTreatmentModal.price }]
                    });
                }
            } catch (err) {
                console.error('Error fetching treatment details for modal:', err);
            } finally {
                setIsDetailsLoading(false);
            }
        };

        fetchDetails();
    }, [selectedTreatmentModal]);

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

    const partnerItem = booking.items.find((i: any) => i.isPartner || i.partnerName);

    const cleanTreatmentTitle = (title: string) => {
        let t = title;
        if (partnerItem?.partnerName) {
            t = t.replace(new RegExp(`\\s*[·•-]\\s*${partnerItem.partnerName}.*`, 'i'), '');
        }
        t = t.replace(/\s*[·•-]\s*Jaens\s*Spa.*$/i, '');
        return t.trim();
    };

    return (
        <div className="invoice-container min-h-[100dvh] bg-secondary/30 pt-16 pb-24 px-4 sm:px-6">
            <style dangerouslySetInnerHTML={{__html: `
                footer, .floating-nav, #floating-nav, .mobile-nav { display: none !important; }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        color: #111827 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 11px !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    header, footer, nav, .floating-nav, #floating-nav, .mobile-nav, .print\\:hidden, button, a {
                        display: none !important;
                    }
                    .invoice-container {
                        padding: 0 !important;
                        margin: 0 auto !important;
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        min-height: auto !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .invoice-card {
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        width: 100% !important;
                        max-width: 580px !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .print-clean-box {
                        border: 1px solid #e5e7eb !important;
                        background: #ffffff !important;
                        background-color: #ffffff !important;
                        border-radius: 12px !important;
                        padding: 10px 14px !important;
                        margin-bottom: 12px !important;
                    }
                    .print-tight-y {
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                    }
                    .print-compact-mb {
                        margin-bottom: 12px !important;
                    }
                    .print-compact-pb {
                        padding-bottom: 12px !important;
                    }
                    * {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}} />

            <div className="invoice-card max-w-lg mx-auto bg-white rounded-3xl shadow-soft-lg overflow-hidden border border-border/80 relative">
                
                {/* Header Pattern - hidden on print for clean document look */}
                <div className="h-2 bg-primary w-full print:hidden"></div>

                <div className="p-6 sm:p-8 print:p-0 print:bg-white">
                    {/* Header: Verified Confirmed Reservation (No Pending State) */}
                    <div className="flex flex-col items-center justify-center text-center mb-6 pb-6 border-b border-border/50 border-dashed print-compact-mb print-compact-pb print:bg-white">
                        {booking.status?.toLowerCase() === 'cancelled' ? (
                            <div className="w-11 h-11 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3 print:w-8 print:h-8 print:mb-1.5 print:bg-white print:border print:border-red-200">
                                <XCircle size={22} className="print:w-5 print:h-5 text-red-500" />
                            </div>
                        ) : (
                            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-xs print:w-8 print:h-8 print:mb-1.5 print:bg-white print:border print:border-emerald-300">
                                <CheckCircle2 size={24} className="print:w-5 print:h-5 text-emerald-600" />
                            </div>
                        )}
                        <h1 className="font-serif text-xl sm:text-2xl text-primary font-bold tracking-wide mb-1 uppercase print:text-base print:mb-0.5 print:text-black">
                            {booking.status?.toLowerCase() === 'cancelled' ? 'RESERVATION CANCELLED' : 'SPA RESERVATION CONFIRMED'}
                        </h1>
                        <p className="text-text-muted text-xs sm:text-sm max-w-[280px] mb-3 print:text-[11px] print:mb-2 print:text-gray-500">
                            {booking.status?.toLowerCase() === 'cancelled' 
                                ? 'Your spa reservation has been cancelled.' 
                                : 'Your spa reservation has been verified and confirmed.'}
                        </p>
                        
                        <div className="bg-black/5 text-primary text-[11px] font-mono font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-lg inline-block print:text-[10px] print:py-1 print:px-3 print:bg-white print:border print:border-gray-300 print:text-black">
                            {booking.id.toUpperCase().substring(0, 10)}
                        </div>
                    </div>

                    {/* Service Provider & Venue: Clean, Short Title, No Extra Labels */}
                    {partnerItem ? (
                        <div className="print-clean-box mb-6 bg-[#F8F9FA] rounded-2xl p-5 border border-border/50 text-center flex flex-col items-center print:bg-white">
                            {partnerItem.partnerLogoUrl ? (
                                <img
                                    src={partnerItem.partnerLogoUrl}
                                    alt={partnerItem.partnerName || 'Partner Spa'}
                                    className="w-14 h-14 rounded-2xl object-cover border border-gray-200 bg-white mb-2.5 shadow-xs print:w-11 print:h-11 print:mb-1.5 print:border-gray-300"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-lg mb-2.5 shadow-xs print:w-11 print:h-11 print:mb-1.5 print:text-sm print:bg-black">
                                    {partnerItem.partnerName?.charAt(0) || 'P'}
                                </div>
                            )}
                            <h2 className="font-serif text-lg sm:text-xl text-primary font-bold tracking-tight leading-tight print:text-sm print:text-black">
                                {partnerItem.partnerName}
                            </h2>
                            {partnerItem.partnerLocation && (
                                <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1.5 font-medium print:text-[10.5px] print:mt-0.5 print:text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 print:w-3 print:h-3" />
                                    {partnerItem.partnerLocation}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mb-6 text-center print-compact-mb print:bg-white">
                            <h2 className="font-serif text-base text-primary font-medium tracking-wide print:text-xs print:text-black">PT BALANCE ISLAND INDONESIA</h2>
                        </div>
                    )}

                    {/* Guest & Venue Details: Simple Clean Rows without Columns - Separate Date and Time */}
                    <div className="print-clean-box mb-6 bg-[#F8F9FA] rounded-2xl p-5 border border-border/40 print:bg-white">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 border-b border-border/50 pb-2 print:pb-1.5 print:mb-2 print:text-gray-400">
                            {partnerItem ? 'Guest & Venue Details' : 'Guest Details'}
                        </h3>
                        <div className="divide-y divide-border/30 text-xs print:text-[11px] print:divide-gray-100">
                            <div className="flex items-center justify-between py-2 print-tight-y">
                                <span className="flex items-center gap-1.5 text-text-muted font-medium print:text-gray-500">
                                    <User className="w-3.5 h-3.5 text-gray-400 print:w-3 print:h-3" /> Guest Name
                                </span>
                                <span className="font-bold text-primary text-right print:text-black">{booking.customerDetails.name}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 print-tight-y">
                                <span className="flex items-center gap-1.5 text-text-muted font-medium print:text-gray-500">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 print:w-3 print:h-3" /> Date
                                </span>
                                <span className="font-bold text-primary text-right print:text-black">{booking.customerDetails.date}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 print-tight-y">
                                <span className="flex items-center gap-1.5 text-text-muted font-medium print:text-gray-500">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 print:w-3 print:h-3" /> Time
                                </span>
                                <span className="font-bold text-primary text-right print:text-black">{booking.customerDetails.time}</span>
                            </div>
                            {booking.customerDetails.location && (
                                <div className="flex items-center justify-between py-2 print-tight-y">
                                    <span className="flex items-center gap-1.5 text-text-muted font-medium print:text-gray-500">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 print:w-3 print:h-3" /> {partnerItem ? 'Staying At' : 'Villa / Hotel'}
                                    </span>
                                    <span className="font-bold text-primary text-right max-w-[60%] truncate print:text-black">{booking.customerDetails.location}</span>
                                </div>
                            )}
                            {partnerItem && (
                                <div className="flex items-center justify-between py-2 print-tight-y">
                                    <span className="flex items-center gap-1.5 text-text-muted font-medium print:text-gray-500">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400 print:w-3 print:h-3" /> Venue
                                    </span>
                                    <span className="font-bold text-primary text-right print:text-black">{partnerItem.partnerName}</span>
                                </div>
                            )}
                            {!partnerItem && booking.customerDetails.room && (
                                <div className="flex items-center justify-between py-2 print-tight-y">
                                    <span className="flex items-center gap-1.5 text-text-muted font-medium print:text-gray-500">
                                        <DoorOpen className="w-3.5 h-3.5 text-gray-400 print:w-3 print:h-3" /> Room
                                    </span>
                                    <span className="font-bold text-primary text-right print:text-black">{booking.customerDetails.room}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Treatments: Clean Title without Partner Redundancy + View Details Link */}
                    <div className="mb-6 print-compact-mb print:bg-white">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 print:mb-2 print:text-gray-400">Treatments</h3>
                        <div className="space-y-3 print:space-y-2">
                            {booking.items.map(item => {
                                const cleanTitle = cleanTreatmentTitle(item.title);
                                const isCouple = ['couple', 'honeymoon'].some(k => item.title.toLowerCase().includes(k));
                                const multiplier = isCouple ? (item.guests / 2) : item.guests;
                                const itemTotal = (item.price * multiplier).toLocaleString('en-US');

                                return (
                                    <div key={item.id} className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0 print:pb-2 print:border-gray-200">
                                        <div className="pr-4">
                                            <p className="text-xs font-bold text-primary mb-0.5 leading-tight print:text-xs print:text-black">{cleanTitle}</p>
                                            <p className="text-[10px] text-text-muted print:text-[10px] print:text-gray-500">
                                                {item.guests} {item.guests > 1 ? 'Guests' : 'Guest'} • {String(item.duration).replace(/mins?/i, '').trim()} Mins
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTreatmentModal(item)}
                                                className="mt-1.5 text-[10px] font-semibold text-primary underline underline-offset-4 hover:text-black flex items-center gap-1 cursor-pointer print:hidden"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-serif font-medium text-primary leading-tight print:text-xs print:font-bold print:text-black">
                                                IDR {itemTotal}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Price Breakdown */}
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
                            <div className="print-clean-box rounded-2xl bg-[#F8F9FA] p-4 border border-border/60 mb-6 space-y-2 print-compact-mb print:space-y-1.5 print:bg-white">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted pb-1.5 border-b border-border/40 print:pb-1.5 print:border-gray-200 print:text-gray-400">
                                    <span>Rate Breakdown</span>
                                    <span>Amount</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 print:text-[11px] print:text-gray-600">
                                    <span>Published Rate</span>
                                    <span className="font-medium text-primary print:text-black">IDR {publishedTotal.toLocaleString('en-US')}</span>
                                </div>
                                {discountTotal > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-600 font-medium print:text-[11px] print:text-emerald-700">
                                        <span>Partner Discount ({discountRate}%)</span>
                                        <span>−IDR {discountTotal.toLocaleString('en-US')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-primary font-medium pt-1 border-t border-border/30 print:text-[11px] print:border-gray-200 print:text-black">
                                    <span>Subtotal</span>
                                    <span>IDR {subtotalTotal.toLocaleString('en-US')}</span>
                                </div>
                                {taxTotal > 0 && (
                                    <div className="flex justify-between text-xs text-gray-600 print:text-[11px] print:text-gray-600">
                                        <span>Tax &amp; Service Charge ({taxRate}%)</span>
                                        <span className="font-medium text-primary print:text-black">+IDR {taxTotal.toLocaleString('en-US')}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 border-t border-border/80 mb-6 print:pt-3 print:mb-0 print:border-t-2 print:border-black print:bg-white">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary print:text-xs print:font-bold print:text-black">Total Paid</span>
                        <span className="text-xl font-serif font-bold text-primary print:text-lg print:font-black print:text-black">
                            IDR {booking.totalPrice.toLocaleString('en-US')}
                        </span>
                    </div>

                    {/* Action Buttons (Strictly Hidden from Printed PDF) */}
                    <div className="flex flex-col gap-3 print:hidden">
                        <button 
                            type="button"
                            onClick={() => window.print()}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-black text-white px-6 py-3.5 rounded-xl text-xs font-bold shadow-md transition-all tracking-widest uppercase cursor-pointer"
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

            {/* Treatment Details Pop-up Modal on Invoice */}
            {selectedTreatmentModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden">
                    <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col text-black max-h-[88vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                            <div>
                                <span className="text-[10px] font-bold tracking-widest text-primary/60 uppercase block">Treatment Details</span>
                                <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                                    {cleanTreatmentTitle(selectedTreatmentModal.title)}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTreatmentModal(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-black hover:text-white flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="py-4 space-y-4 flex-1">
                            {isDetailsLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-xs">Loading details...</span>
                                </div>
                            ) : treatmentDetails ? (() => {
                                let descClean = treatmentDetails.desc || '';
                                let inclusions: { duration: string; name: string }[] = [];

                                if (treatmentDetails.desc) {
                                    const splitRegex = /(?:Treatment\s*Includes|What(?:'s|\s+is)\s*Included|Package\s*Includes)\s*:?\s*/i;
                                    const parts = treatmentDetails.desc.split(splitRegex);
                                    descClean = parts[0].trim();
                                    const rawInclusions = parts.length > 1 ? parts.slice(1).join(' ').trim() : '';

                                    if (rawInclusions) {
                                        const itemRegex = /(\d+\s*(?:Minutes?|Mins?))\s*[–\-:]\s*([^0-9–\-:]+?)(?=(?:\d+\s*(?:Minutes?|Mins?)\s*[–\-:])|$)/gi;
                                        let match;
                                        while ((match = itemRegex.exec(rawInclusions)) !== null) {
                                            const dur = match[1].trim();
                                            const name = match[2].trim().replace(/^[•\-\*,\s]+|[•\-\*,\s]+$/g, '');
                                            if (name) inclusions.push({ duration: dur, name });
                                        }

                                        if (inclusions.length === 0) {
                                            const lines = rawInclusions.split('\n').map((l: string) => l.trim()).filter(Boolean);
                                            for (const line of lines) {
                                                const durMatch = line.match(/^(\d+\s*(?:Minutes?|Mins?))\s*[–\-:]\s*(.+)/i);
                                                if (durMatch) {
                                                    inclusions.push({ duration: durMatch[1].trim(), name: durMatch[2].trim() });
                                                } else {
                                                    inclusions.push({ duration: '', name: line.replace(/^[•\-\*,\s]+/, '') });
                                                }
                                            }
                                        }
                                    }
                                }

                                return (
                                    <>
                                        {treatmentDetails.image_url && (
                                            <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-xs">
                                                <img
                                                    src={treatmentDetails.image_url}
                                                    alt={treatmentDetails.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wider">
                                            <Clock size={12} className="text-gray-500" />
                                            <span>{String(selectedTreatmentModal.duration).replace(/mins?/gi, '').trim()} Mins</span>
                                        </div>

                                        {descClean && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Experience</span>
                                                <p className="text-xs text-gray-600 leading-relaxed font-light">
                                                    {descClean}
                                                </p>
                                            </div>
                                        )}

                                        {inclusions.length > 0 && (
                                            <div className="space-y-2 pt-1">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                                                    <span>Treatment Inclusions</span>
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        {inclusions.length} Steps Included
                                                    </span>
                                                </h4>
                                                <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 overflow-hidden divide-y divide-gray-100">
                                                    {inclusions.map((inc, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-white transition-colors gap-3">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                                                                    {i + 1}
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-900 leading-snug">
                                                                    {inc.name}
                                                                </span>
                                                            </div>
                                                            {inc.duration && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-xs">
                                                                    <Clock size={10} className="text-gray-400" />
                                                                    {inc.duration}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })() : null}
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setSelectedTreatmentModal(null)}
                                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-black hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
