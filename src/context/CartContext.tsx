'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getItemMultiplier } from '@/lib/pricingUtils';

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

export type RestoreBookingAction = {
    bookingId: string;
    mode: 'draft' | 'bookAgain';
    timestamp: number;
};

interface CartContextType {
    history: BookingHistory[];
    saveDraft: (booking: BookingHistory) => void;
    confirmBooking: (bookingId: string) => void;
    removeHistory: (bookingId: string) => void;
    restoreAction: RestoreBookingAction | null;
    triggerRestoreBooking: (bookingId: string, mode: 'draft' | 'bookAgain') => void;
    clearRestoreAction: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<BookingHistory[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [restoreAction, setRestoreAction] = useState<RestoreBookingAction | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('spa_booking_history');
        if (saved) {
            try {
                const parsed: BookingHistory[] = JSON.parse(saved);
                // Sanitize prices: recalculate any draft or confirmed bookings where couple packages were incorrectly doubled
                const sanitized = parsed.map(booking => {
                    if (booking.items && booking.items.length > 0) {
                        const correctedTotal = booking.items.reduce((acc, item) => {
                            const mult = getItemMultiplier(item.title, item.guests);
                            return acc + (Number(item.price) || 0) * mult;
                        }, 0);
                        return {
                            ...booking,
                            totalPrice: correctedTotal
                        };
                    }
                    return booking;
                });
                setHistory(sanitized);
            } catch (e) {
                console.error('Failed to parse booking history', e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('spa_booking_history', JSON.stringify(history));
    }, [history, isLoaded]);

    const saveDraft = (booking: BookingHistory) => {
        // Ensure booking totalPrice uses correct multiplier for couple treatments
        const correctedTotal = (booking.items && booking.items.length > 0)
            ? booking.items.reduce((acc, item) => {
                const mult = getItemMultiplier(item.title, item.guests);
                return acc + (Number(item.price) || 0) * mult;
            }, 0)
            : booking.totalPrice;

        const sanitizedBooking = { ...booking, totalPrice: correctedTotal };

        setHistory(prev => {
            const existing = prev.findIndex(h => h.id === sanitizedBooking.id);
            if (existing >= 0) {
                const newHistory = [...prev];
                newHistory[existing] = sanitizedBooking;
                return newHistory;
            }
            return [sanitizedBooking, ...prev];
        });
    };

    const confirmBooking = (bookingId: string) => {
        setHistory(prev => prev.map(h => h.id === bookingId ? { ...h, status: 'confirmed' } : h));
    };

    const removeHistory = (bookingId: string) => {
        setHistory(prev => prev.filter(h => h.id !== bookingId));
    };

    const triggerRestoreBooking = (bookingId: string, mode: 'draft' | 'bookAgain') => {
        setRestoreAction({ bookingId, mode, timestamp: Date.now() });
    };

    const clearRestoreAction = () => {
        setRestoreAction(null);
    };

    return (
        <CartContext.Provider value={{
            history,
            saveDraft,
            confirmBooking,
            removeHistory,
            restoreAction,
            triggerRestoreBooking,
            clearRestoreAction
        }}>
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
