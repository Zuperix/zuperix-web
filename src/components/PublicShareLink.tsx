'use client';

import { useState, useEffect } from 'react';
import { 
  LockClosedIcon, 
  ArrowDownTrayIcon, 
  EyeIcon, 
  GlobeAltIcon, 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import CustomImage from './CustomImage';
import DownloadModal from './DownloadModal';

interface ShareLinkMeta {
  id: string;
  title: string | null;
  description: string | null;
  type: 'single_asset' | 'multi_asset' | 'category';
  is_password_protected: boolean;
  expires_at: string | null;
  views_count: number;
  allow_download: boolean;
}

interface PublicShareLinkProps {
  uuid: string;
  initialMeta: ShareLinkMeta | null;
  initialError: string | null;
}

export default function PublicShareLink({ uuid, initialMeta, initialError }: PublicShareLinkProps) {
  const [meta, setMeta] = useState<ShareLinkMeta | null>(initialMeta);
  const [error, setError] = useState<string | null>(initialError);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  // Resolved content state
  const [resolvedData, setResolvedData] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [downloadAsset, setDownloadAsset] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Attempt to resolve instantly if not password protected
  useEffect(() => {
    if (meta && !meta.is_password_protected) {
      fetchResolvedContent();
    }
  }, [meta]);

  const fetchResolvedContent = async (passVal?: string) => {
    setIsLoadingContent(true);
    try {
      const url = passVal 
        ? `/share-links/${uuid}?password=${encodeURIComponent(passVal)}` 
        : `/share-links/${uuid}`;
      const response = await apiFetch<any>(url);
      setResolvedData(response);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load content');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsVerifying(true);
    setShake(false);

    try {
      const response = await apiFetch<any>(`/share-links/${uuid}/verify`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setResolvedData(response);
      toast.success('Access granted!');
    } catch (err: any) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error('Incorrect password. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getMimeIcon = (mime: string) => {
    if (!mime) return DocumentIcon;
    if (mime.startsWith('image/')) return PhotoIcon;
    if (mime.startsWith('video/')) return VideoCameraIcon;
    return DocumentIcon;
  };

  const getFileExtension = (name: string, type: string) => {
    if (name && name.includes('.')) {
      return name.split('.').pop()?.toUpperCase();
    }
    return type?.split('/')[1]?.toUpperCase() || 'FILE';
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#07080d] text-white">
        <div className="relative group max-w-md w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500 animate-pulse" />
          <div className="relative bg-[#0b0c13]/90 backdrop-blur-2xl border border-red-500/10 p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-500 animate-bounce" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-3">Link Unavailable</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              {error === 'Shared link not found or has expired' 
                ? 'This shared link has expired or does not exist.' 
                : error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080d]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Render Password Lock Screen
  if (meta.is_password_protected && !resolvedData) {
    return (
      <div className="dark min-h-screen flex flex-col items-center justify-center p-4 bg-[#07080d] text-white">
        <div className={`relative w-full max-w-md transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[32px] blur-xl opacity-30 animate-pulse" />
          <div className="relative bg-[#0f111a]/95 border border-white/5 p-8 sm:p-10 rounded-[32px] shadow-2xl shadow-black/80 flex flex-col items-center text-center">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
              <LockClosedIcon className="h-10 w-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">Password Protected</h2>
            <p className="text-gray-400 text-xs tracking-wider uppercase font-bold mb-6">
              {meta.title || 'Curated Shared Library'}
            </p>

            {meta.description && (
              <p className="text-sm text-gray-500 italic mb-8 max-w-xs">
                "{meta.description}"
              </p>
            )}

            <form onSubmit={handleVerifyPassword} className="w-full space-y-4">
              <input
                type="password"
                placeholder="Enter password to access assets"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-center text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Unlock Portfolio'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Loading state when transitioning to resolved content
  if (isLoadingContent || !resolvedData) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-[#07080d]">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-black tracking-widest uppercase text-gray-500">Decrypting assets...</p>
        </div>
      </div>
    );
  }

  const { title, description, assets: rawAssets = [], allow_download, type, workspace, category } = resolvedData;

  // Normalize assets to ensure they always have 'name' and 'type' properties (falling back to original_name and mime_type)
  const assets = rawAssets.map((asset: any) => ({
    ...asset,
    name: asset.name || asset.original_name || asset.original_filename || asset.filename || 'Untitled Asset',
    type: asset.type || asset.mime_type || 'application/octet-stream'
  }));

  // Search filtering within the shared link assets
  const filteredAssets = assets.filter((asset: any) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSingleAsset = type === 'single_asset';
  const featuredAsset = isSingleAsset ? assets[0] : null;

  return (
    <div className="dark min-h-screen bg-[#07080d] text-white flex flex-col selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* Immersive Header Banner */}
      <header className="relative w-full border-b border-white/5 bg-[#0b0c13]/40 backdrop-blur-3xl px-6 py-8 sm:px-12 flex flex-col items-center text-center">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            {title || 'Shared Portfolio'}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed mx-auto font-medium">
              {description}
            </p>
          )}

          {category && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mt-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">Category: {category.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Showcase Panel */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-[#0c0d15] rounded-[32px] border border-white/5 shadow-2xl shadow-black">
          {/* Left Media Carousel Section */}
          <div className="lg:col-span-7 aspect-square relative bg-[#06070a] border-r border-white/5 overflow-hidden flex items-center justify-center">
            {assets.length > 0 ? (
              <>
                {/* Media Render */}
                {(() => {
                  const activeAsset = assets[currentIndex] || assets[0];
                  const Icon = getMimeIcon(activeAsset.type);
                  const isImage = activeAsset.type.startsWith('image/');
                  const isVideo = activeAsset.type.startsWith('video/');
                  const isPsd = activeAsset.type === 'image/vnd.adobe.photoshop' || activeAsset.type === 'image/x-photoshop';
                  const imageUrl = isPsd ? activeAsset.thumbnail_url : (activeAsset.asset_live_url || activeAsset.thumbnail_url);

                  if (isImage) {
                    return (
                      <CustomImage
                        src={imageUrl}
                        alt={activeAsset.name}
                        fill
                        className="object-contain w-full h-full p-4 animate-in fade-in duration-300"
                        priority
                      />
                    );
                  }

                  if (isVideo) {
                    return (
                      <video
                        src={activeAsset.asset_live_url || activeAsset.download_url}
                        controls
                        className="w-full h-full object-contain p-4 rounded-3xl animate-in fade-in duration-300"
                        poster={activeAsset.thumbnail_url}
                      />
                    );
                  }

                  return (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                      <div className="p-8 bg-white/5 rounded-full border border-white/10 text-6xl shadow-xl">
                        <Icon className="h-16 w-16 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {getFileExtension(activeAsset.name, activeAsset.type)} FILE
                      </span>
                    </div>
                  );
                })()}

                {/* Index Indicator */}
                {assets.length > 1 && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white/90 border border-white/10 shadow-lg">
                    {currentIndex + 1} / {assets.length}
                  </div>
                )}

                {/* Slide Controls */}
                {assets.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex((prev) => (prev === 0 ? assets.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 text-white shadow-lg"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex((prev) => (prev === assets.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 text-white shadow-lg"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>

                    {/* Bottom dots */}
                    <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-none">
                      {assets.map((_: any, idx: number) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-24 flex flex-col items-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-600 mb-2" />
                <p className="text-gray-500 text-sm font-semibold">No assets found in this share link.</p>
              </div>
            )}
          </div>

          {/* Right Post Detail Sidebar */}
          <div className="lg:col-span-5 flex flex-col h-full bg-[#0c0d15] p-6 lg:p-8 justify-between text-left border-t lg:border-t-0 border-white/5 min-h-[400px]">
            <div className="flex-1 flex flex-col justify-between space-y-6">

              {/* Caption & Asset info */}
              <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                <div className="space-y-2 text-left">
                  <h2 className="text-base font-black text-white">{title || 'Shared Portfolio'}</h2>
                  {description && (
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {description}
                    </p>
                  )}
                </div>

                {assets[currentIndex] && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3.5 animate-in fade-in duration-300">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Current Asset Info</p>
                    <h3 className="text-xs font-black truncate text-white" title={assets[currentIndex].name}>
                      {assets[currentIndex].name}
                    </h3>
                    
                    <div className="space-y-2 border-t border-white/5 pt-3.5 text-[11px] font-bold">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Format</span>
                        <span className="text-white font-mono uppercase">{getFileExtension(assets[currentIndex].name, assets[currentIndex].type)}</span>
                      </div>
                      {assets[currentIndex].width && assets[currentIndex].height && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dimensions</span>
                          <span className="text-white font-mono">{assets[currentIndex].width} × {assets[currentIndex].height} px</span>
                        </div>
                      )}
                      {assets[currentIndex].size_bytes && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">File Size</span>
                          <span className="text-white font-mono">{(assets[currentIndex].size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="border-t border-white/5 pt-4 shrink-0 space-y-3">
                {allow_download && assets[currentIndex] && (
                  <button
                    onClick={() => setDownloadAsset(assets[currentIndex])}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4.5 w-4.5" />
                    Download File
                  </button>
                )}

                {allow_download && assets.length > 1 && (
                  <button
                    onClick={() => {
                      assets.forEach((asset: any) => {
                        const link = document.createElement('a');
                        link.href = asset.asset_live_url || asset.download_url;
                        link.download = asset.name;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      });
                    }}
                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download All ({assets.length} Files)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Expanded Asset View Modal */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="bg-[#0f111a] border border-white/5 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Box */}
            <div className="flex-1 bg-black/40 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5 relative min-h-[300px] md:min-h-0">
              {selectedAsset.type.startsWith('image/') ? (
                <CustomImage
                  src={selectedAsset.asset_live_url || selectedAsset.thumbnail_url}
                  alt={selectedAsset.name}
                  fill
                  className="object-contain w-full h-full"
                />
              ) : selectedAsset.type.startsWith('video/') ? (
                <video
                  src={selectedAsset.asset_live_url || selectedAsset.download_url}
                  controls
                  className="w-full h-full object-contain rounded-2xl"
                  poster={selectedAsset.thumbnail_url}
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-8 bg-white/5 border border-white/10 rounded-full text-6xl shadow-xl">
                    📄
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {getFileExtension(selectedAsset.name, selectedAsset.type)} FILE
                  </span>
                </div>
              )}
            </div>

            {/* Metadata / Details Panel */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-[#0f111a] shrink-0">
              <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h4 className="text-lg font-black truncate">{selectedAsset.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1 block">
                      {getFileExtension(selectedAsset.name, selectedAsset.type)} FORMAT
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedAsset(null)}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5 border-t border-white/5 pt-4">
                  {selectedAsset.width && selectedAsset.height && (
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">Resolution</span>
                      <span className="text-white font-mono">{selectedAsset.width} × {selectedAsset.height} px</span>
                    </div>
                  )}
                  {selectedAsset.size_bytes && (
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">File Size</span>
                      <span className="text-white font-mono">{(selectedAsset.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-2">
                {allow_download && (
                  <button
                    onClick={() => {
                      setDownloadAsset(selectedAsset);
                      setSelectedAsset(null);
                    }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4.5 w-4.5" />
                    Download options
                  </button>
                )}
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Download Options Modal */}
      {downloadAsset && (
        <DownloadModal
          isOpen={!!downloadAsset}
          onClose={() => setDownloadAsset(null)}
          assetId={downloadAsset.id}
          originalName={downloadAsset.name || downloadAsset.original_name}
          width={downloadAsset.width || null}
          height={downloadAsset.height || null}
          mimeType={downloadAsset.type || downloadAsset.mime_type}
          previewUrl={(downloadAsset.type === 'image/vnd.adobe.photoshop' || downloadAsset.type === 'image/x-photoshop') 
            ? downloadAsset.thumbnail_url 
            : (downloadAsset.asset_live_url || downloadAsset.thumbnail_url)}
        />
      )}

    </div>
  );
}
