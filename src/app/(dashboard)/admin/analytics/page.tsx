'use client';

import React from 'react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20">
            <ChartBarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">System Analytics</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Real-time performance and system growth metrics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Placeholder for date range selector or export */}
           <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest shadow-xl">
             Last 30 Days
           </div>
        </div>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
