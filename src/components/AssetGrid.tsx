'use client';

import { useState } from 'react';
import { components } from '@/types/api';
import { 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  TrashIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

type Asset = components['schemas']['MetadataEntryDto'] & { 
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  color_palette?: string[] | null;
  status?: string;
};

const STATUS_STYLING: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending_review: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-500 border-green-500/30',
  archived: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  approved: 'Approved',
  archived: 'Archived',
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
  onToggleSelect,
  isSelected,
  onDownload
}: { 
  asset: Asset, 
  onDelete: (id: string) => void, 
  onSelect?: (id: string) => void, 
  onToggleSelect?: (id: string, isShift: boolean) => void,
  isSelected: boolean,
  onDownload?: (asset: Asset) => void
}) => {
  const { activeWorkspace } = useWorkspace();
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/dashboard/assets/${assetId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Detail link copied to clipboard!');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(asset);
    }
  };

  return (
    <div 
      onClick={() => onSelect?.(assetId)}
      data-asset-id={assetId}
      className={`group relative bg-white dark:bg-gray-900/60 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col ${
        isSelected 
          ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 z-10 scale-[1.02]' 
          : 'border-transparent hover:border-indigo-500/30 hover:shadow-2xl hover:bg-gray-800/40'
      }`}
    >
      {/* Top Banner with Image/Preview */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-950/50">
        {mimeType.startsWith('image/') && !imgError ? (
          <img 
            src={`http://localhost:3000/api/v1/assets/${assetId}/view`} 
            alt={originalName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <Icon className="h-12 w-12 text-indigo-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{mimeType.split('/')[1] || 'FILE'}</span>
          </div>
        )}

        {/* Floating Controls Layer */}
        <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start pointer-events-auto">
            {/* Selection Checkbox */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(assetId, e.shiftKey);
              }}
              className={`p-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                  : 'bg-black/20 border-white/20 text-white group-hover:bg-black/40'
              }`}
            >
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white' : 'border-white/60 bg-transparent'}`}>
                {isSelected && <div className="w-2 h-2 bg-indigo-600 rounded-[2px]" />}
              </div>
            </div>

            {/* Status Badge */}
            {asset.status && (
              <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl ${STATUS_STYLING[asset.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {STATUS_LABELS[asset.status] || asset.status}
              </div>
            )}
          </div>

          {/* Color Palette - Now more integrated */}
          {asset.color_palette && asset.color_palette.length > 0 && (
            <div className="flex h-1 gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
              {asset.color_palette.slice(0, 5).map((color, i) => (
                <div key={i} className="flex-1 rounded-full shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white truncate leading-tight tracking-tight group-hover:text-indigo-400 transition-colors" title={originalName}>
            {originalName}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{mimeType.split('/')[1] || 'Unknown'}</span>
            <span className="text-[10px] font-medium text-gray-600">{formatSize(size)}</span>
          </div>
        </div>

        {/* Action Row - Permanent */}
        <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-800/50">
          <button 
            onClick={handleShare}
            className="p-2.5 bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all active:scale-95"
            title="Share Link"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
          
          <button 
            onClick={handleDownload}
            className="p-2.5 bg-gray-800/50 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded-xl transition-all active:scale-95"
            title="Download Options"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>

          <PermissionGate action={Action.Delete} subject="Asset" workspaceId={activeWorkspace?.id}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(assetId);
              }}
              className="p-2.5 bg-gray-800/50 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-xl transition-all active:scale-90"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

export default function AssetGrid({ 
  assets = [], 
  onDelete,
  onSelect,
  onToggleSelect,
  onDownload,
  selectedIds = []
}: {
  assets: Asset[],
  onDelete: (id: string) => void,
  onSelect?: (id: string) => void,
  onToggleSelect?: (id: string, isShift: boolean) => void,
  onDownload?: (asset: Asset) => void,
  selectedIds?: string[]
}) {
  const assetList = Array.isArray(assets) ? assets : [];

  if (assetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
        <FolderIcon className="h-12 w-12 text-gray-700 mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No assets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {assetList.map((asset) => {
        const assetId = asset.id || (asset as any).asset_id;
        const isSelected = selectedIds.includes(assetId);
        
        return (
          <AssetCard 
            key={assetId} 
            asset={asset} 
            onDelete={onDelete} 
            onSelect={onSelect}
            onToggleSelect={onToggleSelect}
            onDownload={onDownload}
            isSelected={isSelected}
          />
        );
      })}
    </div>
  );
}
