'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import TherapickDashboardOverview from './TherapickDashboardOverview';
import TherapickBookingsView from './TherapickBookingsView';
import TherapickPartnersView from './TherapickPartnersView';
import TherapickCommissionView from './TherapickCommissionView';
import TherapickPayoutsView from './TherapickPayoutsView';
import TherapickCalendarView from './TherapickCalendarView';
import TherapickReportsView from './TherapickReportsView';
import TherapickTherapistsView from './TherapickTherapistsView';
import TherapickServicesView from './TherapickServicesView';
import TherapickCustomersView from './TherapickCustomersView';
import TherapickSettingsView from './TherapickSettingsView';

import TherapickBookingDrawer from './TherapickBookingDrawer';
import TherapickPartnerDrawer from './TherapickPartnerDrawer';
import TherapickAddBookingModal from './TherapickAddBookingModal';
import TherapickCreatePayoutModal from './TherapickCreatePayoutModal';
import TherapickAdvancedCalendarModal from './TherapickAdvancedCalendarModal';
import TherapickNotificationCenter from './TherapickNotificationCenter';

interface TherapickMasterViewProps {
  forcedTab?: string;
}

export default function TherapickMasterView({ forcedTab }: TherapickMasterViewProps) {
  const searchParams = useSearchParams();
  const { system } = useTherapickAdmin();

  const tabQuery = forcedTab || searchParams.get('tab') || 'overview';

  // Render respective tab view based on navigation and current system
  const renderActiveView = () => {
    switch (tabQuery) {
      case 'overview':
        return <TherapickDashboardOverview />;
      case 'bookings':
        return <TherapickBookingsView />;
      case 'calendar':
        return <TherapickCalendarView />;
      case 'partners':
      case 'affiliates':
        return <TherapickPartnersView />;
      case 'commission':
      case 'commissions':
        return <TherapickCommissionView />;
      case 'payouts':
        return <TherapickPayoutsView />;
      case 'therapists':
      case 'fees':
        return <TherapickTherapistsView />;
      case 'services':
      case 'treatment':
        return <TherapickServicesView />;
      case 'customers':
        return <TherapickCustomersView />;
      case 'revenue':
      case 'payments':
      case 'reports':
        return <TherapickReportsView />;
      case 'settings':
        return <TherapickSettingsView />;
      default:
        return <TherapickDashboardOverview />;
    }
  };

  return (
    <div className="w-full">
      {renderActiveView()}

      {/* Global Interactive Overlays & Drawers */}
      <TherapickBookingDrawer />
      <TherapickPartnerDrawer />
      <TherapickAddBookingModal />
      <TherapickCreatePayoutModal />
      <TherapickAdvancedCalendarModal />
      <TherapickNotificationCenter />
    </div>
  );
}
