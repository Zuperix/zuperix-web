'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';

export default function SpacerWidget({ widget, isEditMode }: { widget: PortalWidget, isEditMode?: boolean }) {
  const { height = 64 } = widget.config;

  return (
    <div 
      className={`w-full transition-all ${isEditMode ? 'border border-dashed border-gray-800/50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/20 to-transparent flex items-center justify-center rounded-2xl' : ''}`}
      style={{ height: `${height}px` }}
    >
        {isEditMode && (
           <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Spacer ({height}px)</span>
        )}
    </div>
  );
}
