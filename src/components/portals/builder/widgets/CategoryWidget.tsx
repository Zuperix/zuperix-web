'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { FolderIcon } from '@heroicons/react/24/outline';

import PublicAssetCard from '@/components/PublicAssetCard';

export default function CategoryWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { category_id } = widget.config;

  if (isEditMode && !category_id) {
     return (
       <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
           <FolderIcon className="h-10 w-10 text-gray-600 mb-3" />
           <p className="text-sm font-bold text-gray-500">Unconfigured Category</p>
           <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Select a category in the config panel</p>
       </div>
     );
  }

  // Filter assets based on category
  const allAssets = context?.assets || [];
  const filteredAssets = allAssets.filter((asset: any) => {
    return category_id ? asset.category_ids?.includes(category_id) : true;
  });

  // Preview placeholders for editor
  const placeholders = Array.from({ length: 4 });

  if (!isEditMode && filteredAssets.length === 0 && !context?.searchQuery) return null;

  const categoryName = category_id 
    ? (context?.categories?.find((c: any) => c.id === category_id)?.name || `#${category_id.split('-')[0]}`)
    : 'All Tags';

  return (
    <div className="w-full py-8">
      {isEditMode && (
        <div className="mb-6 flex items-center justify-between">
           <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3 lowercase italic font-mono opacity-80">
               <FolderIcon className="h-5 w-5 text-blue-500" />
               {!category_id ? 'All Tags (Preview)' : categoryName}
           </h3>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            <div key={i} className="aspect-square bg-gray-900/40 border border-gray-800/60 rounded-2xl flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
               <div className="text-[10px] text-gray-700 font-bold uppercase tracking-widest transform -rotate-12">Category Item</div>
            </div>
          ))
        ) : null}
      </div>
      {!isEditMode && filteredAssets.length === 0 && context?.searchQuery && (
        <div className="text-center py-12 text-gray-500 italic text-sm">No assets match your search in this category</div>
      )}
    </div>
  );
}
