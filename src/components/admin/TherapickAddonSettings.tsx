'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Layers, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { cx, btn, inputCls, tdCls, thCls, StatusBadge } from './affiliate/ui';

export type CustomAddon = {
    id: string;
    title: string;
    duration: string;
    price: number;
    description?: string;
    is_active: boolean;
};

const STORAGE_KEY = 'therapick_custom_addons';

const PRESET_ADDONS: CustomAddon[] = [
    { id: 'addon-reflexology-30', title: 'Foot Reflexology', duration: '30 Mins', price: 150000, description: 'Pressure-point foot reflexology relieving tired feet.', is_active: true },
    { id: 'addon-head-shoulder-30', title: 'Head, Neck & Shoulder Release', duration: '30 Mins', price: 150000, description: 'Targeted acupressure focusing on desk-strain and tension.', is_active: true },
    { id: 'addon-face-glow-30', title: 'Face Acupressure Glow', duration: '30 Mins', price: 150000, description: 'Natural jade acupressure drainage for a lifted, radiant glow.', is_active: true },
    { id: 'addon-body-scrub-30', title: 'Balinese Herbal Body Scrub', duration: '30 Mins', price: 150000, description: 'Traditional organic Boreh herbs leaving skin silky soft.', is_active: true },
    { id: 'addon-organic-oil', title: 'Organic Essential Oil Upgrade', duration: 'Session', price: 50000, description: 'Premium grade cold-pressed lavender & frangipani aromatherapy oils.', is_active: true }
];

export default function TherapickAddonSettings() {
    const [addons, setAddons] = useState<CustomAddon[]>([]);
    const [search, setSearch] = useState('');
    const [isEditingId, setIsEditingId] = useState<string | null>(null);

    // Form inputs
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('30 Mins');
    const [price, setPrice] = useState('150,000');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setAddons(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to load addons from localStorage', e);
        }
    }, []);

    const saveAddonsToStorage = (updated: CustomAddon[]) => {
        setAddons(updated);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event('therapick_addons_updated'));
        } catch (e) {
            console.error('Failed to save addons to localStorage', e);
        }
    };

    const handleResetForm = () => {
        setIsEditingId(null);
        setTitle('');
        setDuration('30 Mins');
        setPrice('150,000');
        setDescription('');
        setIsActive(true);
    };

    const handleEdit = (addon: CustomAddon) => {
        setIsEditingId(addon.id);
        setTitle(addon.title);
        setDuration(addon.duration);
        setPrice(addon.price.toLocaleString('en-US'));
        setDescription(addon.description || '');
        setIsActive(addon.is_active);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPrice = parseInt(price.replace(/,/g, '') || '0', 10);
        if (!title.trim() || isNaN(cleanPrice) || cleanPrice <= 0) {
            alert('Please provide a valid title and price.');
            return;
        }

        if (isEditingId) {
            const updated = addons.map(a => {
                if (a.id === isEditingId) {
                    return {
                        ...a,
                        title: title.trim(),
                        duration: duration.trim() || '30 Mins',
                        price: cleanPrice,
                        description: description.trim(),
                        is_active: isActive
                    };
                }
                return a;
            });
            saveAddonsToStorage(updated);
        } else {
            const newAddon: CustomAddon = {
                id: 'addon-' + Date.now().toString(),
                title: title.trim(),
                duration: duration.trim() || '30 Mins',
                price: cleanPrice,
                description: description.trim(),
                is_active: isActive
            };
            saveAddonsToStorage([...addons, newAddon]);
        }

        handleResetForm();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this add-on?')) return;
        const updated = addons.filter(a => a.id !== id);
        saveAddonsToStorage(updated);
        if (isEditingId === id) handleResetForm();
    };

    const handleToggleStatus = (id: string) => {
        const updated = addons.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a);
        saveAddonsToStorage(updated);
    };

    const handleLoadPresets = () => {
        if (addons.length > 0 && !confirm('Load standard presets? This will add standard add-on options to your list.')) return;
        saveAddonsToStorage(PRESET_ADDONS);
    };

    const filtered = addons.filter(a => 
        a.title.toLowerCase().includes(search.toLowerCase()) || 
        (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
    );

    const activeCount = addons.filter(a => a.is_active).length;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-black text-white rounded-lg">
                            <Layers size={16} />
                        </span>
                        <h2 className="text-lg md:text-xl font-serif font-medium text-black">Therapick Add-on Settings</h2>
                    </div>
                    <p className="text-xs text-[#737373] mt-1">
                        Configure add-on enhancements for BookTherapick.com clients during booking.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleLoadPresets}
                        className={cx(btn.base, btn.secondary, btn.xs)}
                    >
                        <RefreshCw size={12} />
                        <span>Load Recommended Presets</span>
                    </button>
                </div>
            </div>

            {/* Create / Edit Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                            {isEditingId ? 'Edit Add-on Treatment' : 'Create New Add-on Treatment'}
                        </h3>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                            Set title, duration, additional price, and activation status.
                        </p>
                    </div>
                    {isEditingId && (
                        <button
                            type="button"
                            onClick={handleResetForm}
                            className="text-xs text-[#737373] hover:text-black underline"
                        >
                            Cancel Editing
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Add-on Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Foot Reflexology"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Duration</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 30 Mins"
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[#171717] mb-1.5 block">Additional Price (IDR)</label>
                        <input
                            type="text"
                            required
                            placeholder="150,000"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-[#171717] mb-1.5 block">Description (Optional)</label>
                    <input
                        type="text"
                        placeholder="Short customer-facing description..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className={inputCls}
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            className="w-4 h-4 rounded text-black focus:ring-black"
                        />
                        <span className="text-xs font-medium text-[#171717]">Active (Available for booking on site)</span>
                    </label>

                    <div className="flex items-center gap-3">
                        {saveSuccess && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <Check size={14} /> Saved successfully!
                            </span>
                        )}
                        <button type="submit" className={cx(btn.base, btn.primary, btn.sm)}>
                            <Plus size={14} />
                            <span>{isEditingId ? 'Update Add-on' : 'Save Add-on'}</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Add-ons List */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 md:p-5 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA]">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                            Configured Add-ons ({addons.length})
                        </h4>
                        <p className="text-[11px] text-[#737373]">
                            {activeCount} active add-on{activeCount !== 1 ? 's' : ''} currently displayed to clients on booktherapick.com
                        </p>
                    </div>

                    <div className="w-full sm:w-64 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                        <input
                            type="text"
                            placeholder="Search add-ons..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={cx(inputCls, "pl-8 text-xs")}
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-[#A3A3A3] mx-auto" />
                        <div className="text-sm font-semibold text-black">No add-ons configured yet</div>
                        <p className="text-xs text-[#737373] max-w-sm mx-auto">
                            Add custom add-ons above or click &quot;Load Recommended Presets&quot; to quickly add standard foot reflexology and face acupressure enhancements.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                                <tr>
                                    <th className={thCls}>Add-on Title</th>
                                    <th className={thCls}>Duration</th>
                                    <th className={thCls}>Price (IDR)</th>
                                    <th className={thCls}>Status</th>
                                    <th className={cx(thCls, "text-right")}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E5]">
                                {filtered.map(addon => (
                                    <tr key={addon.id} className="hover:bg-[#F9F9F9] transition-colors">
                                        <td className={tdCls}>
                                            <div className="font-semibold text-black">{addon.title}</div>
                                            {addon.description && (
                                                <div className="text-[11px] text-[#737373] line-clamp-1 mt-0.5">{addon.description}</div>
                                            )}
                                        </td>
                                        <td className={tdCls}>
                                            <span className="font-mono text-[#525252]">{addon.duration}</span>
                                        </td>
                                        <td className={tdCls}>
                                            <span className="font-semibold text-black">
                                                IDR {addon.price.toLocaleString('en-US')}
                                            </span>
                                        </td>
                                        <td className={tdCls}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(addon.id)}
                                                className="cursor-pointer"
                                                title="Click to toggle status"
                                            >
                                                <StatusBadge status={addon.is_active ? 'active' : 'inactive'} />
                                            </button>
                                        </td>
                                        <td className={cx(tdCls, "text-right")}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(addon)}
                                                    className="p-1.5 text-[#525252] hover:text-black hover:bg-[#E5E5E5] rounded-lg transition-colors"
                                                    title="Edit Add-on"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(addon.id)}
                                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Add-on"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
