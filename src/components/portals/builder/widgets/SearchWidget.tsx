'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { placeholder = 'Search assets...', sticky } = widget.config;

  return (
    <div className={`w-full max-w-2xl mx-auto py-8 ${sticky ? 'sticky top-0 z-50' : ''}`}>
      <div className="relative group">
        <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isEditMode ? 'text-gray-600' : 'text-gray-400 group-focus-within:text-blue-500'} transition-colors`} />
        <input 
          disabled={isEditMode}
          type="text" 
          value={context?.searchQuery || ''}
          onChange={(e) => context?.onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-black/40 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-blue-500 focus:bg-gray-900 outline-none transition-all shadow-xl shadow-black/20 ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
        {isEditMode && (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest hidden group-hover:block px-2 py-1 bg-gray-900 rounded-md border border-gray-800">
             Disabled in Edit Mode
          </div>
        )}
      </div>
    </div>
  );
}
