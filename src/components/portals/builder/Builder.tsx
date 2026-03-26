'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BuilderSidebar from './BuilderSidebar';
import BuilderCanvas from './BuilderCanvas';
import ConfigPanel from './ConfigPanel';
import { useBuilderStore, WidgetType } from '@/stores/builderStore';
import { ComputerDesktopIcon, DevicePhoneMobileIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function Builder() {
  const { widgets, reorderWidgets, addWidget, setSelectedWidgetId, portalConfig, isConfigOpen, setIsConfigOpen } = useBuilderStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveType(active.data.current?.type || null);
    
    // Only select if it's an existing widget (not sidebar item)
    if (!active.data.current?.isSidebarItem) {
      setSelectedWidgetId(active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const isActiveSidebarItem = active.data.current?.isSidebarItem;

    if (isActiveSidebarItem) {
      if (over.id === 'canvas-droppable' || widgets.find((w) => w.id === over.id)) {
        // Drop on canvas
        const widgetType = active.data.current?.type as WidgetType;
        const newId = `widget_${Date.now()}`;
        
        let insertIndex = widgets.length;
        if (over.id !== 'canvas-droppable') {
          insertIndex = widgets.findIndex((w) => w.id === over.id);
          const isBelow = event.active.rect.current.translated && event.over?.rect.top
            ? event.active.rect.current.translated.top > event.over.rect.top
            : false;
          // Determine relative position if needed, keeping it simple
        }

        const newWidget = {
          id: newId,
          type: widgetType,
          config: {},
          layout: { x: 0, y: 0, w: 12, h: 2 },
        };
        
        addWidget(newWidget); // In a perfect DND, we would insert at the exact index
        // Since addWidget appends, we might need a specific action if we want insertion at index
        // For now, we update store to add it. A more robust reorder would handle indices.
        // We'll just simple add for now and let user reorder.
        setSelectedWidgetId(newId);
      }
    } else {
      // Reordering existing items
      if (active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id);
        const newIndex = widgets.findIndex((w) => w.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderWidgets(oldIndex, newIndex);
        }
      }
    }
  };

  return (
    <div className="flex bg-gray-950 border border-gray-800 rounded-[32px] overflow-hidden min-h-[800px] h-[calc(100vh-200px)] shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Main Canvas Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-950/80 relative p-8 md:p-12 flex flex-col items-center">
            
            <div 
            className={`${previewMode === 'desktop' ? 'max-w-5xl w-full' : 'max-w-[375px] w-full mt-10'} mx-auto flex-1 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-800/60 flex flex-col overflow-hidden ring-1 ring-white/10 relative transition-all duration-500 ease-in-out`}
            style={{ backgroundColor: portalConfig?.background_color || '#ffffff' }}
          >
            {/* Browser Window Header Mockup */}
            <div className={`h-12 border-b border-gray-800/60 bg-[#1e1e24] flex items-center px-4 gap-4 shrink-0 ${previewMode === 'desktop' ? '' : 'justify-center'} sticky top-0 z-50 transition-colors`}>
              {previewMode === 'desktop' && (
                <div className="flex gap-2 opacity-80">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
                </div>
              )}
              
              <div className="flex-1 flex justify-center items-center">
                <div className={`bg-black/40 rounded-md py-1.5 text-[11px] font-medium text-gray-400 tracking-wide flex items-center justify-center gap-2 border border-white/[0.05] shadow-inner transition-all ${previewMode === 'desktop' ? 'w-full max-w-sm px-4' : 'px-6'}`}>
                   <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   portal.example.com
                </div>
              </div>

              {/* Viewport Toggles (Absolute on Desktop, hidden on Mobile header area) */}
              <div className="flex items-center gap-1 absolute right-4 transition-all">
                 <button 
                  title="Desktop Preview"
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-md transition-colors gap-2 ${previewMode === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   <ComputerDesktopIcon className="h-4 w-4" />
                 </button>
                 <button 
                  title="Mobile Preview"
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-md transition-colors gap-2 ${previewMode === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   <DevicePhoneMobileIcon className="h-4 w-4" />
                 </button>
              </div>

               {/* Config Toggle (Desktop Header) */}
              <div className="flex items-center absolute right-[100px] group">
                 <button 
                  title={isConfigOpen ? "Hide Settings" : "Show Settings"}
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${isConfigOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                 >
                   <AdjustmentsHorizontalIcon className="h-4 w-4" />
                   {!isConfigOpen && <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Settings</span>}
                 </button>
              </div>
            </div>
            
            {/* Drop Zone / Canvas */}
            <div className={`flex-1 flex flex-col relative w-full overflow-x-hidden ${previewMode === 'desktop' ? 'px-8 py-4' : ''}`}>
               <BuilderCanvas />
             </div>
          </div>
          </div>
          <BuilderSidebar />
        </div>
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeId ? (
            <div className="p-4 bg-gray-800 border-2 border-blue-500 rounded-xl shadow-2xl opacity-80 backdrop-blur-md">
              <span className="text-white font-bold uppercase tracking-widest text-xs">
                 Moving {activeType || 'Widget'}...
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {isConfigOpen ? (
        <ConfigPanel />
      ) : (
        <div className="w-12 border-l border-gray-800/60 bg-gray-950 flex flex-col items-center py-6 gap-6 animate-in slide-in-from-right-4 duration-300">
           <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-3 rounded-2xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-all shadow-xl group relative"
            title="Open Settings"
           >
             <AdjustmentsHorizontalIcon className="h-5 w-5" />
             <div className="absolute right-full mr-4 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Open Settings
             </div>
           </button>
        </div>
      )}
    </div>
  );
}
