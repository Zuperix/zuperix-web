'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  LinkIcon, 
  CheckIcon, 
  ClockIcon, 
  GlobeAltIcon, 
  LockClosedIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

interface ShareAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId?: string; // Optional for multi-asset sharing
  assetIds?: string[]; // Optional for multi-asset sharing
  originalName?: string;
}

const EXPIRATION_OPTIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '1 Day', value: 86400 },
  { label: '1 Week', value: 604800 },
  { label: 'Infinite', value: null },
  { label: 'Custom', value: 0 },
];

export default function ShareAssetModal({
  isOpen,
  onClose,
  assetId,
  assetIds = [],
  originalName = 'Multiple Assets',
}: ShareAssetModalProps) {
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'embed' | 'zup'>('zup');
  const [expiresIn, setExpiresIn] = useState<number | null>(3600);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  
  // Zup Share options
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);

  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const finalAssetIds = assetId ? [assetId] : assetIds;
  const isMultiAsset = finalAssetIds.length > 1;

  useEffect(() => {
    if (isOpen) {
      setGeneratedUrl(null);
      setExpiresAt(null);
      setIsCopied(false);
      setExpiresIn(3600);
      setTitle(isMultiAsset ? `Collection of ${finalAssetIds.length} Assets` : originalName);
      setDescription('');
      setPassword('');
      setAllowDownload(true);
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().slice(0, 16));
      
      // Default to Zup Share if sharing multiple assets since Embed only supports single
      if (isMultiAsset) {
        setActiveTab('zup');
      } else {
        setActiveTab('embed');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleGenerateEmbed = async () => {
    if (!assetId) return;
    setIsLoading(true);
    let finalExpiresIn = expiresIn || 604800; // Cap infinite at 7 days for direct S3 URLs

    if (expiresIn === 0) {
      const selected = new Date(selectedDate);
      const now = new Date();
      const diffSeconds = Math.floor((selected.getTime() - now.getTime()) / 1000);
      
      if (diffSeconds <= 0) {
        toast.error('Please select a date in the future');
        setIsLoading(false);
        return;
      }
      
      finalExpiresIn = Math.min(diffSeconds, 604800); // Caps at 7 days
      if (diffSeconds > 604800) {
        toast.info('Direct S3 URL expiration capped at 7 days for security compliance.');
      }
    }

    try {
      const response = await apiFetch<{ url: string; expires_at: string }>(
        `/assets/${assetId}/share`,
        {
          method: 'POST',
          body: JSON.stringify({ expires_in: finalExpiresIn }),
        }
      );
      setGeneratedUrl(response.url);
      setExpiresAt(response.expires_at);
      toast.success('Embed URL generated successfully!');
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      toast.error('Failed to generate shared link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateZupShare = async () => {
    if (!activeWorkspace) {
      toast.error('Active workspace is required');
      return;
    }
    setIsLoading(true);
    
    let finalExpiresIn: number | null = null;
    if (expiresIn !== null) {
      if (expiresIn === 0) {
        const selected = new Date(selectedDate);
        const now = new Date();
        const diffSeconds = Math.floor((selected.getTime() - now.getTime()) / 1000);
        if (diffSeconds <= 0) {
          toast.error('Please select a date in the future');
          setIsLoading(false);
          return;
        }
        finalExpiresIn = diffSeconds;
      } else {
        finalExpiresIn = expiresIn;
      }
    }

    try {
      const payload = {
        workspace_id: activeWorkspace.id,
        type: isMultiAsset ? 'multi_asset' : 'single_asset',
        asset_ids: finalAssetIds,
        title: title || undefined,
        description: description || undefined,
        password: password || undefined,
        expires_in: finalExpiresIn || undefined,
        allow_download: allowDownload,
      };

      const response = await apiFetch<any>('/share-links', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Zup Share endpoint: s/<uuid>
      const shareBase = process.env.NEXT_PUBLIC_SHARE_URL || window.location.origin;
      const shareUrl = `${shareBase}/s/${response.id}`;
      
      setGeneratedUrl(shareUrl);
      setExpiresAt(response.expiresAt || null);
      toast.success('Zup Share page generated!');
    } catch (error: any) {
      console.error('Failed to generate Zup Share link:', error);
      toast.error(error.message || 'Failed to create share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0f111a] rounded-[32px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 shrink-0">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <GlobeAltIcon className="h-6 w-6 text-indigo-500" />
              Zuperix Share
            </h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate mt-1 max-w-[280px]" title={originalName}>
              {isMultiAsset ? `${finalAssetIds.length} Assets Selected` : originalName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs selector */}
        {!generatedUrl && (
          <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 p-2 shrink-0">
            <button
              onClick={() => setActiveTab('embed')}
              disabled={isMultiAsset}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isMultiAsset 
                  ? 'opacity-40 cursor-not-allowed text-gray-400' 
                  : activeTab === 'embed'
                  ? 'bg-white dark:bg-white/5 text-indigo-500 dark:text-white shadow-sm border border-gray-200/50 dark:border-white/5 font-black'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Embed Link
            </button>
            <button
              onClick={() => setActiveTab('zup')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeTab === 'zup'
                  ? 'bg-white dark:bg-white/5 text-indigo-500 dark:text-white shadow-sm border border-gray-200/50 dark:border-white/5 font-black'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Squares2X2Icon className="h-3.5 w-3.5" />
              Zup Share UI
            </button>
          </div>
        )}

        {/* Content Scroll Area */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {!generatedUrl ? (
            <div className="space-y-6">
              {activeTab === 'embed' ? (
                /* Direct S3 Embed Link Mode */
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-xs text-blue-500 font-medium">
                    Generates a direct asset file URL. Ideal for embedding in external applications, web pages, or media players. Expires strictly for security compliance.
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <ClockIcon className="h-3.5 w-3.5" />
                      Link Expiration
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {EXPIRATION_OPTIONS.slice(0, 3).concat(EXPIRATION_OPTIONS.slice(4)).map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setExpiresIn(opt.value)}
                          className={`px-1.5 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-2 text-center ${
                            expiresIn === opt.value
                              ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:border-gray-200 dark:hover:border-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {expiresIn === 0 && (
                      <div className="flex flex-col gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
                        <label htmlFor="embed-expiry-date" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          Custom Expiration Timestamp
                        </label>
                        <input
                          id="embed-expiry-date"
                          name="embed_expiry_date"
                          type="datetime-local"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleGenerateEmbed}
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4" />
                        Generate Direct Link
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Premium Zup Share Portal Mode */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-4">
                    {/* Title input */}
                    <div className="space-y-2">
                      <label htmlFor="share-title" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Share Title
                      </label>
                      <input
                        id="share-title"
                        name="share_title"
                        type="text"
                        placeholder="e.g. Summer Campaign Assets"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    {/* Description input */}
                    <div className="space-y-2">
                      <label htmlFor="share-description" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Description / Notes
                      </label>
                      <textarea
                        id="share-description"
                        name="share_description"
                        placeholder="Add some notes about these assets for your clients..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Password Protection */}
                      <div className="space-y-2">
                        <label htmlFor="share-password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <LockClosedIcon className="h-3 w-3 text-indigo-500" />
                          Password Lock
                        </label>
                        <input
                          id="share-password"
                          name="share_password"
                          type="password"
                          placeholder="Optional password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>

                      {/* Expiration Options */}
                      <div className="space-y-2">
                        <label htmlFor="share-expires-in" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Expires In
                        </label>
                        <select
                          id="share-expires-in"
                          name="share_expires_in"
                          value={expiresIn === null ? 'infinite' : expiresIn}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'infinite') setExpiresIn(null);
                            else if (val === 'custom') setExpiresIn(0);
                            else setExpiresIn(Number(val));
                          }}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                          <option value={3600}>1 Hour</option>
                          <option value={86400}>1 Day</option>
                          <option value={604800}>1 Week</option>
                          <option value="infinite">Infinite (No Expiry)</option>
                          <option value="custom">Custom Date</option>
                        </select>
                      </div>
                    </div>

                    {expiresIn === 0 && (
                      <div className="flex flex-col gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
                        <label htmlFor="share-custom-expiry-date" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          Custom Expiration Timestamp
                        </label>
                        <input
                          id="share-custom-expiry-date"
                          name="share_custom_expiry_date"
                          type="datetime-local"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    )}

                    {/* Permissions and settings */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <ArrowDownTrayIcon className="h-5 w-5 text-indigo-500" />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">Allow Public Downloads</p>
                          <p className="text-[10px] text-gray-400">Let viewers download the full resolution file</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowDownload(!allowDownload)}
                        className={`w-11 h-6 rounded-full transition-all relative ${
                          allowDownload ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-white/10'
                        }`}
                      >
                        <span 
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all transform ${
                            allowDownload ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateZupShare}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <GlobeAltIcon className="h-4 w-4" />
                        Create Zup Share Link
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Secure Link Created State */
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4" />
                  Shared Link Created Successfully
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative p-5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                    <p className="text-xs font-mono text-gray-950 dark:text-gray-100 break-all select-all">
                      {generatedUrl}
                    </p>
                  </div>
                </div>
                {expiresAt && (
                   <p className="text-[10px] text-gray-400 font-medium text-center italic">
                     Valid until {new Date(expiresAt).toLocaleString()}
                   </p>
                )}
                {password && (
                  <p className="text-[10px] text-amber-500 font-bold text-center flex items-center justify-center gap-1">
                    <LockClosedIcon className="h-3 w-3" /> Password protection is active
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isCopied ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Copy Address
                    </>
                  )}
                </button>
                <button
                  onClick={() => setGeneratedUrl(null)}
                  className="px-6 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
