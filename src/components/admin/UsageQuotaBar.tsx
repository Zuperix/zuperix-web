'use client';

import React from 'react';
import { clsx } from 'clsx';

interface UsageQuotaBarProps {
  label: string;
  used: number;
  total: number;
  unit: string;
  colorClass: string;
  formatValue: (val: number) => string;
}

export default function UsageQuotaBar({
  label,
  used,
  total,
  unit,
  colorClass,
  formatValue
}: UsageQuotaBarProps) {
  const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const remaining = Math.max(0, total - used);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 shadow-sm dark:shadow-2xl transition-all hover:border-gray-200 dark:hover:border-gray-700">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{label}</h4>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
            <span className="text-gray-900 dark:text-white">{formatValue(used)}</span>
            <span className="mx-1">of</span>
            <span>{formatValue(total)} {unit}</span>
          </p>
        </div>
      </div>

      <div className="relative h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
        <div 
          className={clsx(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out shadow-lg",
            colorClass
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <div className={clsx("h-2.5 w-2.5 rounded-full shadow-sm", colorClass)} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Used</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700 shadow-sm" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining ({formatValue(remaining)})</span>
        </div>
      </div>
    </div>
  );
}
