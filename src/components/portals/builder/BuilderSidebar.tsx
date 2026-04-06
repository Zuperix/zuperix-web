'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useBuilderStore, hasSearchWidget } from '@/stores/builderStore';
import { 
  MagnifyingGlassIcon, 
  Square3Stack3DIcon, 
  FolderIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  ArrowsUpDownIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const AVAILABLE_WIDGETS = [
  { type: 'search', label: 'Search Bar', icon: MagnifyingGlassIcon, desc: 'Add a global search bar to help users find assets quickly.' },
  { type: 'assets_grid', label: 'Assets Grid', icon: Square3Stack3DIcon, desc: 'Display a dynamic, responsive grid of all portal assets.' },
  { type: 'collection', label: 'Collection', icon: FolderIcon, desc: 'Showcase assets from a specific folder or collection.' },
  { type: 'category', label: 'Category', icon: FolderIcon, desc: 'Filter and display assets belonging to a specific category.' },
  { type: 'banner', label: 'Banner', icon: PhotoIcon, desc: 'Add a high-impact visual header with custom titles.' },
  { type: 'text', label: 'Text/Heading', icon: DocumentTextIcon, desc: 'Insert rich text contents, headings, or descriptions.' },
  { type: 'spacer', label: 'Spacer', icon: ArrowsUpDownIcon, desc: 'Add vertical breathing room between your page components.' },
];

function SidebarItem({ widget, disabled }: { widget: any, disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${widget.type}`,
    data: {
      type: widget.type,
      isSidebarItem: true,
    },
    disabled,
  });

  const Icon = widget.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={widget.label}
      className={`p-3 rounded-2xl flex items-center justify-center transition-all select-none relative group
        ${disabled 
          ? 'opacity-30 cursor-not-allowed' 
          : isDragging 
            ? 'opacity-50 bg-blue-500/20 text-blue-500 scale-105' 
            : 'hover:bg-gray-800 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white hover:scale-110'
        }`}
    >
      <Icon className="h-6 w-6 transition-colors" />
      
      {/* Detailed Tooltip on hover */}
      <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 p-3 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[60] scale-95 group-hover:scale-100 origin-bottom">
         <div className="flex items-center gap-2 mb-1.5">
           <div className="p-1 bg-blue-500/10 rounded-md text-blue-500">
              <Icon className="h-3.5 w-3.5" />
           </div>
           <span className="text-[11px] font-bold text-white uppercase tracking-wider">{widget.label}</span>
         </div>
         <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
            {widget.desc}
         </p>
         
         {/* Tooltip Arrow */}
         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

export default function BuilderSidebar() {
  const { widgets } = useBuilderStore();
  const searchExists = hasSearchWidget(widgets);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center p-2 bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl shadow-black/50 z-50 ring-1 ring-white/10 gap-2">
      {AVAILABLE_WIDGETS.map((widget) => {
        const disabled = widget.type === 'search' && searchExists;
        return (
          <SidebarItem key={widget.type} widget={widget} disabled={disabled} />
        );
      })}
    </div>
  );
}
