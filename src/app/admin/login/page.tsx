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
        <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center p-4 selection:bg-[#d8ecee] selection:text-[#0b7a73] font-['Urbanist',sans-serif]">
            <div className="w-full max-w-md bg-[#fdfdfb] rounded-3xl p-8 sm:p-10 border border-[rgba(22,26,25,0.08)] shadow-[0_1px_2px_rgba(22,26,25,0.04),0_14px_32px_-16px_rgba(22,26,25,0.18)]">
                <div className="text-center mb-8">
                    {/* Fitlo Brand Mark */}
                    <div className="w-12 h-12 rounded-2xl bg-[#0b7a73] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_8px_18px_-6px_rgba(11,122,115,0.5)]">
                        <span className="font-bold text-lg tracking-wider">TP</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0efea] border border-[rgba(22,26,25,0.08)] text-[11px] font-bold text-[#161a19] mb-3">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: domainInfo.brand === 'therapick' ? '#0b7a73' : dotColor }} />
                        <span>{domainInfo.badgeText}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161a19] tracking-tight mb-2">{loginTitle}</h1>
                    <p className="text-xs text-[#5f6665] max-w-xs mx-auto leading-relaxed">{loginSubtitle}</p>
                </div>

                {error && (
                    <div className="bg-[rgba(180,35,24,0.08)] text-[#b42318] p-3 rounded-xl text-xs mb-6 text-center border border-[rgba(180,35,24,0.15)] font-semibold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#5f6665] mb-1.5 ml-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#5f6665]">
                                <Mail className="h-4 w-4" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#fdfdfb] border border-[rgba(22,26,25,0.15)] rounded-xl h-11 pl-10 pr-4 text-xs font-semibold text-[#161a19] placeholder:text-[#8a9190] focus:outline-none focus:border-[#0b7a73] focus:ring-3 focus:ring-[rgba(11,122,115,0.12)] transition-all"
                                placeholder="putuedosantika@gmail.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#5f6665] mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#5f6665]">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#fdfdfb] border border-[rgba(22,26,25,0.15)] rounded-xl h-11 pl-10 pr-4 text-xs font-semibold text-[#161a19] placeholder:text-[#8a9190] focus:outline-none focus:border-[#0b7a73] focus:ring-3 focus:ring-[rgba(11,122,115,0.12)] transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-[#0b7a73] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#08665f] transition-all disabled:opacity-70 mt-6 shadow-[0_6px_16px_-8px_#0b7a73] cursor-pointer"
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

