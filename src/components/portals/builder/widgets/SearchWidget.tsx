import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { isColorDark } from '@/lib/image';

export default function SearchWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { placeholder = 'Search assets...', sticky } = widget.config;

  const backgroundColor = context?.portalConfig?.background_color || '#fafafa';
  const isDark = isColorDark(backgroundColor);

  return (
    <div className={`w-full max-w-2xl mx-auto py-8 ${sticky ? 'sticky top-0 z-50' : ''}`}>
      <div className="relative group">
        <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${
          isEditMode 
            ? 'text-gray-600' 
            : isDark 
              ? 'text-gray-400 group-focus-within:text-blue-500' 
              : 'text-gray-400 group-focus-within:text-blue-500'
        } transition-colors`} />
        <input 
          disabled={isEditMode}
          type="text" 
          value={context?.searchQuery || ''}
          onChange={(e) => context?.onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl pl-12 pr-4 py-4 text-sm outline-none transition-all ${
            isDark 
              ? 'bg-black/40 border border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-gray-900 shadow-xl shadow-black/20' 
              : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-gray-50 shadow-md shadow-gray-200/50'
          } ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
        {isEditMode && (
          <div className={`absolute top-1/2 -translate-y-1/2 right-4 text-[10px] font-bold uppercase tracking-widest hidden group-hover:block px-2 py-1 rounded-md border ${
            isDark 
              ? 'bg-gray-900 border-gray-800 text-gray-600' 
              : 'bg-gray-100 border-gray-200 text-gray-400'
          }`}>
             Disabled in Edit Mode
          </div>
        )}
      </div>
    </div>
  );
}
