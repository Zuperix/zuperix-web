'use client';

import { useState } from 'react';
import CustomImage from './CustomImage';
import { components } from '@/types/api';
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  TrashIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ArrowUturnLeftIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';
import { useWorkspace } from '@/context/WorkspaceContext';
import ShareAssetModal from './ShareAssetModal';
import ThreeDPreview from './ThreeDPreview';
import PdfPreview from './PdfPreview';
import FileTypeIcon from './FileTypeIcon';

type Asset = components['schemas']['MetadataEntryDto'] & {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  color_palette?: string[] | null;
  status?: string;
  is_ocr_match?: boolean;
  is_text_extraction_match?: boolean;
  is_semantic_match?: boolean;
  asset_live_url?: string;
  thumbnail_lg_url?: string;
  source?: string;
  is_imported?: boolean;
  drive_file_id?: string;
};

const is3D = (mime: string, filename: string) => {
  const m = mime.toLowerCase();
  const f = filename.toLowerCase();
  return (
    m === 'model/gltf-binary' ||
    m === 'model/gltf+json' ||
    m.includes('model/') ||
    f.endsWith('.glb') ||
    f.endsWith('.gltf')
  );
};

const STATUS_STYLING: Record<string, string> = {
  draft: 'bg-gray-900/40 text-gray-300 border-white/10 backdrop-blur-md shadow-sm',
  pending_review: 'bg-amber-500/60 text-white border-white/20 backdrop-blur-md shadow-md shadow-amber-900/10',
  approved: 'bg-emerald-500/60 text-white border-white/20 backdrop-blur-md shadow-md shadow-emerald-900/10',
  archived: 'bg-rose-500/60 text-white border-white/20 backdrop-blur-md shadow-md shadow-rose-900/10',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
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
  onDownload,
  onRestore,
  onShare,
}: { 
  asset: Asset, 
  onDelete: (id: string) => void, 
  onSelect?: (id: string) => void, 
  onToggleSelect?: (id: string, isShift: boolean) => void,
  isSelected: boolean,
  onDownload?: (asset: Asset) => void,
  onRestore?: (id: string) => void,
  onShare: (asset: Asset) => void,
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
    onShare(asset);
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
      className={`group relative bg-white dark:bg-gray-900/60 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col ${isSelected
          ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 z-10 scale-[1.02]'
          : 'border-transparent hover:border-indigo-500/30 hover:shadow-2xl hover:bg-gray-800/40'
        }`}
    >
      {/* Top Banner with Image/Preview/3D */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-950/50">
        {is3D(mimeType, originalName) ? (
          <ThreeDPreview src={asset.asset_live_url!} alt={originalName} />
        ) : mimeType === 'application/pdf' ? (
          <PdfPreview
            src={asset.asset_live_url!}
            assetId={assetId}
            alt={originalName}
          />

        ) : mimeType.startsWith('image/') && !imgError ? (
          <CustomImage 
            src={asset.thumbnail_lg_url || asset.asset_live_url!} 
            alt={originalName}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <FileTypeIcon mimeType={mimeType} filename={originalName} />
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
              className={`p-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer ${isSelected
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                  : 'bg-black/20 border-white/20 text-white group-hover:bg-black/40'
                }`}
            >
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white' : 'border-white/60 bg-transparent'}`}>
                {isSelected && <div className="w-2 h-2 bg-indigo-600 rounded-[2px]" />}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col gap-1 items-end">
              {asset.status && (
                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border backdrop-blur-xl flex items-center gap-1 ${STATUS_STYLING[asset.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                  {asset.status === 'pending_review' && <LockClosedIcon className="h-2.5 w-2.5" />}
                  {STATUS_LABELS[asset.status] || asset.status}
                </div>
              )}
              {asset.source === 'google_drive' && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-600 border border-white/20 text-white text-[8px] font-black uppercase tracking-tighter rounded-lg backdrop-blur-xl shadow-lg">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M7.71 3.502L1.15 15l3.414 6h13.15l6.56-11.498L17.71 3.502H7.71zm1.26 2h7.06l5.41 9.498h-7.06L9 15.002z" />
                  </svg>
                  {asset.is_imported ? 'Google Drive' : 'Drive Linked'}
                </div>
              )}
              {asset.is_ocr_match && (
                <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-tighter rounded-lg backdrop-blur-xl">
                  OCR Match
                </div>
              )}
              {asset.is_text_extraction_match && (
                <div className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-500 text-[8px] font-black uppercase tracking-tighter rounded-lg backdrop-blur-xl">
                  Text Match
                </div>
              )}
              {asset.is_semantic_match && (
                <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-500 text-[8px] font-black uppercase tracking-tighter rounded-lg backdrop-blur-xl">
                  Semantic Match
                </div>
              )}
            </div>
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
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{mimeType?.split('/')[1] || 'Unknown'}</span>
            <span className="text-[10px] font-medium text-gray-600">{formatSize(size)}</span>
          </div>
        </div>

        {/* Action Row - Permanent */}
        <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-800/50">
          <button
            onClick={handleShare}
            className="p-2.5 bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all active:scale-95"
            title="Secure Share Link"
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

          {onRestore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore(assetId);
              }}
              className="p-2.5 bg-gray-800/50 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-xl transition-all active:scale-95"
              title="Restore"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </button>
          )}

          <PermissionGate action={Action.Delete} subject="Asset" workspaceId={activeWorkspace?.id}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(assetId);
              }}
              className="p-2.5 bg-gray-800/50 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-xl transition-all active:scale-90"
              title={onRestore ? "Permanently Delete" : "Delete"}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

const SkeletonAssetCard = () => (
  <div className="bg-white dark:bg-gray-900/60 rounded-2xl border-2 border-transparent overflow-hidden flex flex-col">
    {/* Top Banner Skeleton */}
    <div className="relative aspect-[4/3] w-full bg-gray-200 dark:bg-gray-800/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>

    {/* Content Section Skeleton */}
    <div className="p-5 space-y-4">
      <div className="space-y-2">
        {/* Title Skeleton */}
        <div className="relative h-4 bg-gray-200 dark:bg-gray-800/80 rounded-md w-3/4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        {/* Meta Row Skeleton */}
        <div className="flex justify-between items-center">
          <div className="relative h-3 bg-gray-200 dark:bg-gray-800/80 rounded-md w-1/4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-800/80 rounded-md w-1/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* Action Row Skeleton */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800/50">
        <div className="relative h-9 w-9 bg-gray-200 dark:bg-gray-800/80 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        <div className="relative h-9 w-9 bg-gray-200 dark:bg-gray-800/80 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        <div className="relative h-9 w-9 bg-gray-200 dark:bg-gray-800/80 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  </div>
);

export default function AssetGrid({
  assets = [],
  onDelete,
  onSelect,
  onToggleSelect,
  onDownload,
  onRestore,
  selectedIds = [],
  loading = false,
  limit = 12
}: {
  assets: Asset[],
  onDelete: (id: string) => void,
  onSelect?: (id: string) => void,
  onToggleSelect?: (id: string, isShift: boolean) => void,
  onDownload?: (asset: Asset) => void,
  onRestore?: (id: string) => void,
  selectedIds?: string[],
  loading?: boolean,
  limit?: number
}) {
  const [sharingAsset, setSharingAsset] = useState<Asset | null>(null);
  const assetList = Array.isArray(assets) ? assets : [];


  if (loading && assetList.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {[...Array(limit)].map((_, i) => (
          <SkeletonAssetCard key={i} />
        ))}
      </div>
    );
  }

  if (assetList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
        <FolderIcon className="h-12 w-12 text-gray-700 mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No assets found</p>
      </div>
    );
  }

  return (
    <>
      <div className={`relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 transition-all duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {/* Shimmer Overlay during pagination/filtering if assets exist */}
        {loading && (
          <div className="absolute inset-0 z-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pointer-events-none">
            {[...Array(Math.min(assetList.length, limit))].map((_, i) => (
              <SkeletonAssetCard key={`shimmer-${i}`} />
            ))}
          </div>
        )}
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
              onRestore={onRestore}
              onShare={(a) => setSharingAsset(a)}
              isSelected={isSelected}
            />
          );
        })}
      </div>

      <ShareAssetModal
        isOpen={!!sharingAsset}
        onClose={() => setSharingAsset(null)}
        assetId={sharingAsset?.id || ''}
        originalName={sharingAsset?.original_name || ''}
      />
    </>
  );
}
