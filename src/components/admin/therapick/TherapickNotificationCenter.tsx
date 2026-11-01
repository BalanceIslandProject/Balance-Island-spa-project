'use client';

import React from 'react';
import { X, Check, Bell, Calendar, UserCheck, AlertCircle, DollarSign, Wallet, ArrowRight, ExternalLink } from 'lucide-react';
import { useTherapickAdmin, AdminNotification } from '@/context/TherapickAdminContext';

export default function TherapickNotificationCenter() {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    setSelectedBooking,
    setSelectedPartner,
    bookings,
    partners
  } = useTherapickAdmin();

  if (!isNotificationCenterOpen) return null;

  const handleNotificationClick = (notif: AdminNotification) => {
    markNotificationAsRead(notif.id);

    if (notif.data?.booking_id) {
      const b = bookings.find(item => item.id === notif.data?.booking_id);
      if (b) {
        setSelectedBooking(b);
        setIsNotificationCenterOpen(false);
        return;
      }
    }

    if (notif.data?.partner_id) {
      const p = partners.find(item => item.id === notif.data?.partner_id);
      if (p) {
        setSelectedPartner(p);
        setIsNotificationCenterOpen(false);
        return;
      }
    }
  };

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_website_booking':
        return <Calendar size={14} className="text-blue-600" />;
      case 'new_affiliate_booking':
        return <Calendar size={14} className="text-amber-600" />;
      case 'new_partner_application':
        return <UserCheck size={14} className="text-purple-600" />;
      case 'booking_cancellation':
        return <AlertCircle size={14} className="text-rose-600" />;
      case 'new_commission_generated':
        return <DollarSign size={14} className="text-emerald-600" />;
      case 'payout_request':
      case 'payout_completed':
        return <Wallet size={14} className="text-teal-600" />;
      case 'calendar_conflict':
        return <AlertCircle size={14} className="text-orange-600" />;
      default:
        return <Bell size={14} className="text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-neutral-800">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Notifications</h3>
              <p className="text-[11px] text-stone-500">
                {unreadNotificationCount} unread system alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-semibold text-stone-600 hover:text-neutral-950 px-2 py-1 rounded-md hover:bg-stone-200/50 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNotificationCenterOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <Bell size={20} />
              </div>
              <p className="text-xs font-semibold text-stone-600">No notifications yet</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                New bookings, payouts, and partner activity will show here in realtime.
              </p>
            </div>
          ) : (
            notifications.map(n => {
              const dateStr = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                    n.is_read ? 'hover:bg-stone-50' : 'bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-2xs ${
                    n.is_read ? 'bg-stone-100 text-stone-500' : 'bg-white ring-2 ring-amber-200'
                  }`}>
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs ${n.is_read ? 'font-medium text-stone-700' : 'font-bold text-neutral-900'}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-stone-400 shrink-0">{dateStr}</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 self-center" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/50 text-center">
          <span className="text-[11px] font-mono text-stone-500">
            Realtime Supabase Event Listener Active
          </span>
        </div>
      </div>
    </div>
  );
}
