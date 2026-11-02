'use client';

import React from 'react';
import { Globe, Users } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickSystemSwitcher() {
  const { system, setSystem, activeTab, setActiveTab } = useTherapickAdmin();

  const handleSwitch = (newSystem: 'website' | 'affiliate') => {
    if (newSystem === system) return;
    setSystem(newSystem);

    if (newSystem === 'website' && ['partners', 'commission', 'payouts'].includes(activeTab)) {
      setActiveTab('overview');
    }
    if (newSystem === 'affiliate' && ['therapists', 'services', 'customers', 'revenue', 'payments'].includes(activeTab)) {
      setActiveTab('overview');
    }
  };

  return (
    <div className="fitlo-sides select-none">
      <button
        type="button"
        onClick={() => handleSwitch('website')}
        className={`flex items-center gap-1.5 ${system === 'website' ? 'is-active' : ''}`}
      >
        <Globe size={14} />
        <span>Website</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('affiliate')}
        className={`flex items-center gap-1.5 ${system === 'affiliate' ? 'is-active' : ''}`}
      >
        <Users size={14} />
        <span>Affiliate</span>
      </button>
    </div>
  );
}
