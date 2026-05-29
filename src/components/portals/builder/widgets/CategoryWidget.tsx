import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import { FolderIcon } from '@heroicons/react/24/outline';
import PublicAssetCard from '@/components/PublicAssetCard';
import { isColorDark } from '@/lib/image';

export default function CategoryWidget({ widget, isEditMode, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  const { category_id, columns = 3, show_header = true, title: customTitle } = widget.config;

  const backgroundColor = context?.portalConfig?.background_color || '#fafafa';
  const isDark = isColorDark(backgroundColor);

  if (isEditMode && !category_id) {
     return (
       <div className={`w-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-colors ${
         isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-300 bg-gray-100/50'
       }`}>
           <FolderIcon className={`h-10 w-10 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
           <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-700'}`}>Unconfigured Category</p>
           <p className={`text-[10px] uppercase tracking-widest mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Select a category in the config panel</p>
       </div>
     );
  }

  // Filter assets based on category
  const allAssets = context?.assets || [];
  const filteredAssets = allAssets.filter((asset: any) => {
    return category_id ? asset.category_ids?.includes(category_id) : true;
  });

  // Preview placeholders for editor
  const placeholders = Array.from({ length: columns });

  if (!isEditMode && filteredAssets.length === 0 && !context?.searchQuery) return null;

  const categoryName = category_id 
    ? (context?.categories?.find((c: any) => c.id === category_id)?.name || `#${category_id.split('-')[0]}`)
    : 'All Tags';

  const showHeader = show_header && (isEditMode || category_id || customTitle);
  const displayTitle = customTitle || categoryName;

  return (
    <div className="w-full py-8">
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
           <h3 className={`text-lg font-bold tracking-tight flex items-center gap-3 lowercase italic font-mono opacity-80 ${isDark ? 'text-white' : 'text-gray-900'}`}>
               <FolderIcon className="h-5 w-5 text-blue-500" />
               {!category_id && !customTitle ? 'All Tags (Preview)' : displayTitle}
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
              isDark ? 'bg-gray-900/40 border border-gray-800/60' : 'bg-gray-100 border border-gray-200'
            }`}>
               <div className={`text-[10px] font-bold uppercase tracking-widest transform -rotate-12 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>Category Item</div>
            </div>
          ))
        ) : null}
      </div>
      {!isEditMode && filteredAssets.length === 0 && context?.searchQuery && (
        <div className={`text-center py-12 italic text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No assets match your search in this category</div>
      )}
    </div>
  );
}
