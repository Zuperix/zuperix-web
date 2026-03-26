'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore, PortalWidget } from '@/stores/builderStore';
import { TrashIcon, DocumentDuplicateIcon, Bars3Icon } from '@heroicons/react/24/outline';
import WidgetRenderer from './WidgetRenderer';

export default function SortableWidget({ widget }: { widget: PortalWidget }) {
  const { selectedWidgetId, setSelectedWidgetId, removeWidget, duplicateWidget, portalAssets, portalCategories, portalCollections } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

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
      className={`relative group rounded-3xl border-2 transition-all duration-200 
        ${isDragging ? 'opacity-40 z-50 scale-105 shadow-2xl' : ''} 
        ${isSelected ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] z-20' : 'border-transparent hover:border-gray-800'}
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
      <div className={`rounded-3xl overflow-hidden bg-gray-900/60 backdrop-blur-md transition-all ${isSelected ? '' : 'grayscale-[20%]'}`}>
         <WidgetRenderer widget={widget} isEditMode={true} context={{ assets: portalAssets, categories: portalCategories, collections: portalCollections }} />
      </div>
    </div>
  );
}
