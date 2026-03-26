'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBuilderStore } from '@/stores/builderStore';
import SortableWidget from './SortableWidget';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

export default function BuilderCanvas() {
  const { widgets, setSelectedWidgetId } = useBuilderStore();
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-full p-8 transition-colors ${
        isOver ? 'bg-blue-900/10' : ''
      }`}
      onClick={() => setSelectedWidgetId(null)}
    >
      {widgets.length === 0 ? (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-[32px] m-4 pointer-events-none">
          <div className="p-6 bg-gray-900/50 rounded-full mb-4 opacity-50">
            <Squares2X2Icon className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="text-white font-bold text-lg">Canvas is empty</h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed">
            Drag widgets from the sidebar and drop them here.
          </p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-4 pb-32">
          <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            {widgets.map((widget) => (
              <SortableWidget key={widget.id} widget={widget} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
