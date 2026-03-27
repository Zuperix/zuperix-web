'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';

export default function TextWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { heading = 'Your Heading', body = 'Detailed description or body text goes here. You can edit this in the config panel.', align = 'left' } = widget.config;

  return (
    <div className={`w-full py-12 px-6 ${
      align === 'center' ? 'text-center' : 
      align === 'right' ? 'text-right' : 
      'text-left'
    }`}>
      <div className={`max-w-4xl ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`}>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">{heading}</h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-2xl whitespace-pre-wrap ${align === 'center' ? 'mx-auto' : ''}">
          {body}
        </p>
      </div>
    </div>
  );
}
