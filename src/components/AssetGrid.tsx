'use client';

import { useState } from 'react';
import { components } from '@/types/api';
import { 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  TrashIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

type Asset = components['schemas']['MetadataEntryDto'] & { 
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  color_palette?: string[] | null;
};

const getIcon = (mime: string) => {
  if (mime.startsWith('image/')) return PhotoIcon;
  if (mime.startsWith('video/')) return VideoCameraIcon;
  return DocumentIcon;
};

const AssetCard = ({ 
  asset, 
  onDelete, 
  onSelect, 
  isSelected 
}: { 
  asset: Asset, 
  onDelete: (id: string) => void, 
  onSelect?: (id: string) => void, 
  isSelected: boolean 
}) => {
  const [imgError, setImgError] = useState(false);
  const mimeType = asset.mime_type || 'application/octet-stream';
  const Icon = getIcon(mimeType);

  const assetId = asset.id || (asset as any).asset_id || (asset as any)._id;
  const originalName = asset.original_name || (asset as any).original_filename || 'Unknown';
  const size = asset.size !== undefined ? asset.size : (asset as any).file_size || 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      onClick={() => onSelect?.(assetId)}
      className={`group relative bg-white dark:bg-gray-900/40 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected 
          ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20' 
          : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-blue-900/10'
      }`}
    >
      <div className="aspect-square bg-gray-50 dark:bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {mimeType.startsWith('image/') && !imgError ? (
          <img 
            src={`http://localhost:3000/api/v1/assets/${assetId}/view`} 
            alt={originalName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Icon className="h-14 w-14 text-gray-300 dark:text-gray-700 group-hover:text-blue-500/50 transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{mimeType.split('/')[1] || 'FILE'}</span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 z-10">
          <div className="flex justify-end">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(assetId);
              }}
              className="p-2 bg-white/10 hover:bg-red-500/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all"
              title="Delete asset"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Metadata</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-white border border-white/10 uppercase font-medium">
                {mimeType.split('/')[1] || 'BIN'}
              </span>
              <span className="text-[10px] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-white border border-white/10 uppercase font-medium">
                {formatSize(size)}
              </span>
            </div>
          </div>
        </div>

        {/* Color Palette Strip - Floating style */}
        {asset.color_palette && asset.color_palette.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex h-1.5 gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 z-20">
            {asset.color_palette.slice(0, 6).map((color, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-full shadow-sm ring-1 ring-black/10" 
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800/50">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={originalName}>
          {originalName}
        </p>
        <div className="flex items-center justify-between mt-1 sm:mt-1.5">
          <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">{mimeType.split('/')[1] || 'File'}</p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-600 font-medium">{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default function AssetGrid({ 
  assets = [], 
  onDelete,
  onSelect,
  selectedId
}: { 
  assets: Asset[], 
  onDelete: (id: string) => void,
  onSelect?: (id: string) => void,
  selectedId?: string
}) {
  const assetList = Array.isArray(assets) ? assets : [];

  if (assetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed dark:border-gray-800 rounded-xl">
        <FolderIcon className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500">No assets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
      {assetList.map((asset) => (
        <AssetCard 
          key={asset.id} 
          asset={asset} 
          onDelete={onDelete} 
          onSelect={onSelect}
          isSelected={selectedId === asset.id}
        />
      ))}
    </div>
  );
}
