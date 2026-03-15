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
  const Icon = getIcon(asset.mime_type);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      onClick={() => onSelect?.(asset.id)}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
        isSelected 
          ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' 
          : 'border-transparent dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
        {asset.mime_type.startsWith('image/') && !imgError ? (
          <img 
            src={`http://localhost:3000/api/v1/assets/${asset.id}/view`} 
            alt={asset.original_name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon className="h-12 w-12 text-gray-400" />
        )}
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset.id);
            }}
            className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={asset.original_name}>
          {asset.original_name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">{formatSize(asset.size)}</p>
          <p className="text-xs text-gray-400">{new Date(asset.created_at).toLocaleDateString()}</p>
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
