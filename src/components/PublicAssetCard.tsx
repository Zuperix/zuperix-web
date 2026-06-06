'use client';

import { useState } from 'react';
import { 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { BASE_URL } from '@/lib/api';
import CustomImage from './CustomImage';

interface PublicAsset {
  id: string;
  name: string;
  type: string;
  thumbnail_url: string;
  thumbnail_lg_url?: string;
  download_url: string;
  asset_live_url?: string;
  width?: number;
  height?: number;
  original_name?: string;
  mime_type?: string;
}

const getIcon = (mime: string) => {
  if (mime.startsWith('image/')) return PhotoIcon;
  if (mime.startsWith('video/')) return VideoCameraIcon;
  return DocumentIcon;
};

export default function PublicAssetCard({ 
  asset, 
  onDownload 
}: { 
  asset: PublicAsset, 
  onDownload: (asset: PublicAsset) => void 
}) {
  const [imgError, setImgError] = useState(false);
  const Icon = getIcon(asset.type);

  // Use the full URL if it's a relative path from the backend
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || BASE_URL.replace('/api/v1', '');
  
  // Prioritize CloudFront signed URL (asset_live_url) or thumbnail_lg_url, falling back to relative thumbnail_url
  const isPsd = asset.type === 'image/vnd.adobe.photoshop' || asset.type === 'image/x-photoshop';
  let imageUrl = isPsd 
    ? (asset.thumbnail_lg_url || asset.asset_live_url || asset.thumbnail_url)
    : (asset.asset_live_url || asset.thumbnail_lg_url || asset.thumbnail_url);

  if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    imageUrl = `${backendUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  return (
    <div className="group relative bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-blue-900/10">
      <div className="aspect-square bg-gray-50 dark:bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {asset.type.startsWith('image/') && !imgError && imageUrl ? (
          <CustomImage 
            src={imageUrl} 
            alt={asset.name}
            fill
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Icon className="h-14 w-14 text-gray-300 dark:text-gray-700 group-hover:text-blue-500/50 transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{asset.type?.split('/')[1] || 'FILE'}</span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 z-10">
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => onDownload(asset)}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-all flex items-center justify-center"
              title="Download asset"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      
      <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={asset.name}>
          {asset.name}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">{asset.type?.split('/')[1] || 'File'}</p>
        </div>
      </div>
    </div>
  );
}
