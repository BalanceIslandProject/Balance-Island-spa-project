'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CartItem = {
    id: string;
    treatmentId: string;
    title: string;
    duration: number | string;
    price: number;
    guests: number;
    isCampaign?: boolean;
    campaignTitle?: string;
    tripOffer?: string;
    discountPercentage?: number;
};

export type BookingHistory = {
    id: string;
    date: string; // ISO string of when it was booked
    status: 'draft' | 'confirmed';
    items: CartItem[];
    customerDetails: {
        name: string;
        date: string;
        time: string;
        location: string;
        room: string;
    };
    totalPrice: number;
};

interface CartContextType {
    history: BookingHistory[];
    saveDraft: (booking: BookingHistory) => void;
    confirmBooking: (bookingId: string) => void;
    removeHistory: (bookingId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<BookingHistory[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('spa_booking_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse booking history', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('spa_booking_history', JSON.stringify(history));
    }, [history]);

    const saveDraft = (booking: BookingHistory) => {
        setHistory(prev => {
            const existing = prev.findIndex(h => h.id === booking.id);
            if (existing >= 0) {
                const newHistory = [...prev];
                newHistory[existing] = booking;
                return newHistory;
            }
            return [booking, ...prev];
        });
    };

    const confirmBooking = (bookingId: string) => {
        setHistory(prev => prev.map(h => h.id === bookingId ? { ...h, status: 'confirmed' } : h));
    };

    const removeHistory = (bookingId: string) => {
        setHistory(prev => prev.filter(h => h.id !== bookingId));
    };

    return (
        <CartContext.Provider value={{ history, saveDraft, confirmBooking, removeHistory }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
