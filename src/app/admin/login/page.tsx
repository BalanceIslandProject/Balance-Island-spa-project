'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { getAdminDomainInfo } from '@/lib/domainIsolation';

function AdminLoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [clientHost, setClientHost] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setClientHost(window.location.host);
        }
    }, []);

    const brandParam = searchParams.get('brand');
    const domainInfo = useMemo(() => {
        return getAdminDomainInfo(clientHost, brandParam);
    }, [clientHost, brandParam]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const targetUrl = domainInfo.defaultAdminUrl || '/admin';
                router.push(targetUrl);
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const dotColor = 
        domainInfo.brand === 'therapick' ? '#facc15' :
        domainInfo.brand === 'elexoir' ? '#eab308' :
        domainInfo.brand === 'bali' ? '#10b981' : '#475569';

    const loginTitle = 
        domainInfo.brand === 'therapick' ? 'Therapick Admin' :
        domainInfo.brand === 'elexoir' ? 'Elexoir Admin' :
        domainInfo.brand === 'bali' ? 'Home Spa Ubud Admin' : 'Central Admin';

    const loginSubtitle = 
        domainInfo.brand === 'therapick' ? 'Sign in to access Therapick Admin System' :
        domainInfo.brand === 'elexoir' ? 'Sign in to access Elexoir Luxury Home Spa console' :
        domainInfo.brand === 'bali' ? 'Sign in to access Ubud Home Spa console' : 'Dual-brand operations for Elexoir & Home Spa Ubud';

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 selection:bg-amber-300">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-stone-200/80">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-xs font-bold text-neutral-800 mb-3 shadow-2xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                        <span>{domainInfo.badgeText}</span>
                    </div>
                    <h1 className="font-serif text-3xl text-neutral-900 font-medium mb-1.5">{loginTitle}</h1>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">{loginSubtitle}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-6 text-center border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-mono font-bold tracking-wider uppercase text-stone-600 mb-1.5 ml-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-stone-400">
                                <Mail className="h-4 w-4" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-stone-50/60 border border-stone-200 rounded-xl h-11 pl-10 pr-4 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-sans"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-mono font-bold tracking-wider uppercase text-stone-600 mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-stone-400">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-stone-50/60 border border-stone-200 rounded-xl h-11 pl-10 pr-4 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-sans"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-neutral-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:opacity-70 mt-6 shadow-xs cursor-pointer"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                        {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AdminLogin() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-stone-400">Loading sign in...</div>}>
            <AdminLoginForm />
        </Suspense>
    );
}

