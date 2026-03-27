'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function BannerWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { image_url, title = 'Hero Banner', height = 400 } = widget.config;

  return (
    <div 
      className="w-full relative overflow-hidden rounded-3xl bg-gray-900 flex items-center justify-center border border-gray-800 group"
      style={{ height: `${height}px` }}
    >
      {image_url ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10" />
        </>
      ) : null}
      
      <div className="relative z-20 text-center px-6 max-w-4xl">
         <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
            {title}
         </h1>
      </div>
    </div>
  );
}
