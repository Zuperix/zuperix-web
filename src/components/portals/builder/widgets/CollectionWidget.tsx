'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { FolderIcon } from '@heroicons/react/24/outline';
import PublicAssetCard from '@/components/PublicAssetCard';

export default function CollectionWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { collection_id, columns = 3 } = widget.config;

  if (isEditMode && !collection_id) {
     return (
       <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
           <FolderIcon className="h-10 w-10 text-gray-600 mb-3" />
           <p className="text-sm font-bold text-gray-500">Unconfigured Collection</p>
           <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Select a collection in the config panel</p>
       </div>
     );
  }

  // Filter assets based on collection
  const allAssets = context?.assets || [];
  const filteredAssets = allAssets.filter((asset: any) => {
    return collection_id ? asset.collection_ids?.includes(collection_id) : true;
  });

  const placeholders = Array.from({ length: columns });

  if (!isEditMode && filteredAssets.length === 0 && !context?.searchQuery) return null;

  const collectionName = collection_id 
    ? (context?.collections?.find((c: any) => c.id === collection_id)?.name || 'Collection')
    : 'All Assets';

  return (
    <div className="w-full py-8">
      {isEditMode && (
        <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                <FolderIcon className="h-6 w-6 text-blue-500" />
                {!collection_id ? 'All Assets (Preview)' : collectionName}
            </h3>
        </div>
      )}
      <div className={`grid gap-6 ${
        columns === 2 ? 'grid-cols-2' : 
        columns === 3 ? 'grid-cols-3' : 
        columns === 4 ? 'grid-cols-4' : 
        'grid-cols-5'
      }`}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset: any) => (
            <PublicAssetCard 
              key={asset.id} 
              asset={asset} 
              onDownload={context?.onDownload} 
            />
          ))

        ) : isEditMode ? (
          placeholders.map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center opacity-60">
               <div className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Col Item {i + 1}</div>
            </div>
          ))
        ) : null}
      </div>
      {!isEditMode && filteredAssets.length === 0 && context?.searchQuery && (
        <div className="text-center py-12 text-gray-500 italic text-sm">No assets match your search in this collection</div>
      )}
    </div>
  );
}
