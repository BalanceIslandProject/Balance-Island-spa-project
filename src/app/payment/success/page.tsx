'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Home, MessageCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
    const [waUrl, setWaUrl] = useState<string | null>(null);

    useEffect(() => {
        const pendingMessage = localStorage.getItem('pendingBookingMessage');
        if (pendingMessage) {
            const finalMessage = pendingMessage;
            const url = `https://wa.me/6285174119423?text=${encodeURIComponent(finalMessage)}`;
            setWaUrl(url);

            // Clean up so it doesn't trigger again on refresh
            localStorage.removeItem('pendingBookingMessage');

            // Automatic redirect after a short delay
            setTimeout(() => {
                window.location.href = url;
            }, 2500);
        }
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
            <div className="bg-white rounded-[40px] p-10 md:p-16 text-center max-w-lg w-full shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-border/50">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 border border-green-100 shadow-inner animate-bounce">
                    <CheckCircle2 size={48} strokeWidth={2} />
                </div>
                <h1 className="font-serif text-3xl md:text-4xl text-primary font-medium mb-4 tracking-tight">Payment Successful</h1>
                <p className="text-text-muted text-sm md:text-base leading-relaxed mb-10">
                    Thank you for your purchase. We have received your payment. {waUrl ? "You are being redirected to WhatsApp to complete your booking confirmation..." : "You will receive a confirmation shortly."}
                </p>

                <div className="flex flex-col gap-4">
                    {waUrl && (
                        <a href={waUrl} className="inline-flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#20bd5a] transition-all shadow-[0_8px_24px_rgb(0,0,0,0.15)] hover:scale-[1.02] uppercase tracking-widest">
                            <MessageCircle size={18} /> Confirm on WhatsApp
                        </a>
                    )}
                    <Link href="/" className="inline-flex items-center justify-center gap-3 w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-[0_8px_24px_rgb(0,0,0,0.15)] hover:scale-[1.02] uppercase tracking-widest">
                        <Home size={18} /> Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
