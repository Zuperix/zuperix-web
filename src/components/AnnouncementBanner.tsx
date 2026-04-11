'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnnouncementStyle } from '@/types/announcement';

export function AnnouncementBanner() {
  const { user } = useAuth();
  const customer = user?.customer;

  const isVisible = useMemo(() => {
    if (!customer?.announcement_header || !customer?.announcement_description) {
      return false;
    }

    const now = new Date();
    const start = customer.announcement_start_at ? new Date(customer.announcement_start_at) : null;
    const end = customer.announcement_end_at ? new Date(customer.announcement_end_at) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  }, [customer]);

  if (!isVisible) return null;

  const style = customer?.announcement_style || AnnouncementStyle.INFO;

  const styleClasses = {
    [AnnouncementStyle.INFO]: 'bg-indigo-600 text-white',
    [AnnouncementStyle.WARNING]: 'bg-amber-500 text-white',
    [AnnouncementStyle.CRITICAL]: 'bg-rose-600 text-white',
  }[style as AnnouncementStyle] || 'bg-indigo-600 text-white';

  const Icon = {
    [AnnouncementStyle.INFO]: Info,
    [AnnouncementStyle.WARNING]: AlertTriangle,
    [AnnouncementStyle.CRITICAL]: AlertCircle,
  }[style as AnnouncementStyle] || Info;

  return (
    <div className={`w-full py-2.5 px-4 flex items-center justify-between gap-4 transition-all duration-300 ${styleClasses}`}>
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
          <span className="font-bold whitespace-nowrap">{customer?.announcement_header}</span>
          <span className="hidden sm:inline opacity-40">|</span>
          <p className="text-sm opacity-95 truncate">
            {customer?.announcement_description}
          </p>
        </div>
      </div>
      {/* Optional: Add a close button if needed, but per requirements it might be persistent */}
    </div>
  );
}
