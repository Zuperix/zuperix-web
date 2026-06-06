import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { isColorDark } from '@/lib/image';

export default function TextWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { heading = 'Your Heading', body = 'Detailed description or body text goes here. You can edit this in the config panel.', align = 'left', heading_color, body_color, background_color } = widget.config;

  const defaultBgColor = context?.portalConfig?.background_color || '#fafafa';
  const isDark = isColorDark(defaultBgColor);

  const finalHeadingColor = heading_color || (isDark ? '#ffffff' : '#111827');
  const finalBodyColor = body_color || (isDark ? '#9ca3af' : '#4b5563');

  return (
    <div 
      className={`w-full py-12 px-6 rounded-3xl transition-colors ${
        align === 'center' ? 'text-center' : 
        align === 'right' ? 'text-right' : 
        'text-left'
      }`}
      style={{ backgroundColor: background_color || 'transparent' }}
    >
      <div className={`max-w-4xl ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`}>
        <h2 
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
          style={{ color: finalHeadingColor }}
        >
          {heading}
        </h2>
        <p 
          className={`text-sm leading-relaxed max-w-2xl whitespace-pre-wrap ${align === 'center' ? 'mx-auto' : ''}`}
          style={{ color: finalBodyColor }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
