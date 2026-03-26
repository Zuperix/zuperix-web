'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import PublicAssetCard from '@/components/PublicAssetCard'; // Assuming this exists from original page

export default function AssetsGridWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { columns = 3 } = widget.config;

  // Filter assets based on search
  const allAssets = context?.assets || [];
  const filteredAssets = allAssets;
  
  const placeholders = Array.from({ length: columns * 2 });

  return (
    <div className="w-full py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`grid gap-6 ${
        columns === 2 ? 'grid-cols-2' : 
        columns === 3 ? 'grid-cols-3' : 
        columns === 4 ? 'grid-cols-4' : 
        'grid-cols-5'
      }`}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset: any) => (
            <PublicAssetCard key={asset.id} asset={asset} />
          ))
        ) : isEditMode ? (
          placeholders.map((_, i) => (
            <div key={i} className="aspect-square bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center opacity-60">
               <div className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Asset {i + 1}</div>
            </div>
          ))
        ) : null}
      </div>
      {!isEditMode && filteredAssets.length === 0 && context?.searchQuery && (
        <div className="text-center py-24 text-gray-500 italic">No assets found matching "{context.searchQuery}"</div>
      )}
      {isEditMode && (
        <div className="mt-4 flex justify-center">
           <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              Live Assets will populate here
           </span>
        </div>
      )}
    </div>
  );
}
