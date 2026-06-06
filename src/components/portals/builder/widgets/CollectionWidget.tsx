import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { FolderIcon } from '@heroicons/react/24/outline';
import PublicAssetCard from '@/components/PublicAssetCard';
import { isColorDark } from '@/lib/image';

export default function CollectionWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { collection_id, columns = 3, show_header = true, title: customTitle } = widget.config;

  const backgroundColor = context?.portalConfig?.background_color || '#fafafa';
  const isDark = isColorDark(backgroundColor);

  if (isEditMode && !collection_id) {
     return (
       <div className={`w-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-colors ${
         isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-300 bg-gray-100/50'
       }`}>
           <FolderIcon className={`h-10 w-10 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
           <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-700'}`}>Unconfigured Collection</p>
           <p className={`text-[10px] uppercase tracking-widest mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Select a collection in the config panel</p>
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

  const showHeader = show_header && (isEditMode || collection_id || customTitle);
  const displayTitle = customTitle || collectionName;

  return (
    <div className="w-full py-8">
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
            <h3 className={`text-lg font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <FolderIcon className="h-6 w-6 text-blue-500" />
                {!collection_id && !customTitle ? 'All Assets (Preview)' : displayTitle}
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
            <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${
              isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'
            }`}>
               <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>Col Item {i + 1}</div>
            </div>
          ))
        ) : null}
      </div>
      {!isEditMode && filteredAssets.length === 0 && context?.searchQuery && (
        <div className={`text-center py-12 italic text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No assets match your search in this collection</div>
      )}
    </div>
  );
}
