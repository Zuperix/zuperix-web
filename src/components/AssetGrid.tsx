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
      className={`group relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
        isSelected 
          ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' 
          : 'border-transparent dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
        {mimeType.startsWith('image/') && !imgError ? (
          <img 
            src={`http://localhost:3000/api/v1/assets/${assetId}/view`} 
            alt={originalName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon className="h-12 w-12 text-gray-400" />
        )}
        
        {/* Trash Action */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(assetId);
            }}
            className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Color Palette Strip */}
        {asset.color_palette && asset.color_palette.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex h-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {asset.color_palette.slice(0, 5).map((color, i) => (
              <div 
                key={i} 
                className="flex-1" 
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={originalName}>
          {originalName}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500 truncate mr-2">{formatSize(size)}</p>
          <p className="text-xs text-gray-400 shrink-0">{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A'}</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
