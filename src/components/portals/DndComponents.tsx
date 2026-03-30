'use client';

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  PhotoIcon, 
  DocumentIcon, 
  PlusIcon, 
  CheckIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { BASE_URL } from '@/lib/api';

export const ItemTypes = {
  ASSET: 'asset',
};

export function DraggableAsset({ asset, onAdd, isAlreadyInPortal }: any) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ASSET,
    item: { id: asset.id },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !isAlreadyInPortal,
  }), [asset.id, isAlreadyInPortal]);

  return (
    <div 
      ref={drag as any}
      className={`group bg-gray-900/60 rounded-2xl border border-gray-800/60 p-3 hover:border-blue-500/40 transition-all flex flex-col gap-3 ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'} ${isAlreadyInPortal ? 'cursor-not-allowed grayscale-[0.5]' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="aspect-video bg-gray-950 rounded-xl overflow-hidden relative">
         {asset.mime_type?.startsWith('image/') || asset.type?.startsWith('image/') ? (
           <img 
            src={`${BASE_URL}/assets/${asset.id}/view`} 
            alt={asset.original_name || asset.name}
            className="w-full h-full object-cover"
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center">
             <DocumentIcon className="h-8 w-8 text-gray-700" />
           </div>
         )}
         {isDragging && (
           <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[2px] flex items-center justify-center">
              <PlusIcon className="h-8 w-8 text-white animate-bounce" />
           </div>
         )}
      </div>
      <div className="flex flex-col gap-2">
         <p className="text-xs font-bold text-white truncate px-1">{asset.original_name || asset.name}</p>
         {isAlreadyInPortal ? (
           <button disabled className="w-full py-2 bg-gray-800/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
             <CheckIcon className="h-3 w-3" />
             Already in Portal
           </button>
         ) : (
           <button 
            onClick={() => onAdd(asset.id)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95"
           >
             Add to Portal
           </button>
         )}
      </div>
    </div>
  );
}

export function DroppablePortalAssets({ assets, onDrop, onOpenSearch }: any) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.ASSET,
    drop: (item: any) => onDrop(item.id),
    collect: (monitor: any) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDrop]);

  const active = isOver && canDrop;

  return (
    <div 
      ref={drop as any}
      className={`min-h-[400px] rounded-[48px] transition-all duration-300 border-2 border-dashed ${active ? 'bg-blue-600/10 border-blue-500 scale-[1.01] shadow-2xl shadow-blue-500/10' : 'bg-gray-900/10 border-gray-800'}`}
    >
      {assets.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-6">
           <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'bg-blue-500 text-white rotate-12 scale-110' : 'bg-gray-800/50 text-gray-700'}`}>
              {active ? <PlusIcon className="h-12 w-12" /> : <PhotoIcon className="h-12 w-12" />}
           </div>
           <div className="text-center space-y-1">
               <p className="text-white font-bold text-xl">{active ? 'Drop to Add Asset' : 'No assets in this portal'}</p>
               <p className="text-gray-500 text-sm">{active ? 'Release to include this asset in the portal.' : 'Drag assets from the library or search to add them.'}</p>
           </div>
           {!active && (
             <button 
                onClick={onOpenSearch}
                className="mt-4 px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20"
             >
                Search Assets to Add
             </button>
           )}
        </div>
      ) : (
        <div className="p-8">
          {active && (
             <div className="mb-8 p-6 bg-blue-600 rounded-3xl flex items-center justify-center gap-4 animate-pulse">
                <PlusIcon className="h-6 w-6 text-white" />
                <span className="text-sm font-black text-white uppercase tracking-widest">Drop here to add to portal</span>
             </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {assets.map((asset: any) => (
              <div key={asset.id} className="group relative bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden hover:border-blue-500/30 transition-all shadow-lg">
                <div className="aspect-square bg-gray-900 flex items-center justify-center relative">
                  {(asset.type?.startsWith('image/') || asset.mime_type?.startsWith('image/')) ? (
                    <img 
                      src={`${BASE_URL}/assets/${asset.id}/view`} 
                      alt={asset.name || asset.original_name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <DocumentIcon className="h-12 w-12 text-gray-800" />
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-xl backdrop-blur-md transition-all">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-900/40">
                  <p className="text-[11px] font-bold text-gray-300 truncate">{asset.name || asset.original_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
