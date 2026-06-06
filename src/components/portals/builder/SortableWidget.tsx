'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore, PortalWidget } from '@/stores/builderStore';
import { TrashIcon, DocumentDuplicateIcon, Bars3Icon } from '@heroicons/react/24/outline';
import WidgetRenderer from './WidgetRenderer';
import { isColorDark } from '@/lib/image';

export default function SortableWidget({ widget }: { widget: PortalWidget }) {
  const { selectedWidgetId, setSelectedWidgetId, removeWidget, duplicateWidget, portalAssets, portalCategories, portalCollections, portalConfig } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;
  const isDark = isColorDark(portalConfig?.background_color);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedWidgetId(widget.id);
      }}
      className={`relative group rounded-[32px] border-2 border-transparent
        ${isDragging ? 'opacity-40 z-50 scale-[1.02] shadow-2xl cursor-grabbing' : 'cursor-pointer'} 
        ${!isDragging ? 'transition-all duration-500 ease-out' : ''}
        ${isSelected ? 'z-20' : ''}
        ${widget.type === 'search' && widget.config.sticky ? 'sticky top-0 z-40' : ''}`
      }
    >
      {/* Controls */}
      <div 
        className={`absolute -top-4 right-6 flex items-center bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden transition-all duration-200 z-30
          ${isSelected || isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0'}`}
      >
        <div 
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="p-2.5 hover:bg-gray-800 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing border-r border-gray-800"
          title="Drag to reorder"
        >
          <Bars3Icon className="h-4 w-4" />
        </div>
        {widget.type !== 'search' && (
          <button 
            onClick={(e) => { e.stopPropagation(); duplicateWidget(widget.id); }}
            className="p-2.5 hover:bg-gray-800 text-gray-400 hover:text-white border-r border-gray-800 transition-colors"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
          className="p-2.5 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Widget Content */}
      <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${isSelected ? '' : 'opacity-95'}`}>
         <WidgetRenderer widget={widget} isEditMode={true} context={{ assets: portalAssets, categories: portalCategories, collections: portalCollections, portalConfig }} />
      </div>
    </div>
  );
}
