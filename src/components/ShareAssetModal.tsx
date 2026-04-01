'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, LinkIcon, CheckIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface ShareAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  originalName: string;
}

const EXPIRATION_OPTIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '1 Day', value: 86400 },
  { label: 'Infinite', value: 604800 },
  { label: 'Custom', value: 0 },
];

export default function ShareAssetModal({
  isOpen,
  onClose,
  assetId,
  originalName,
}: ShareAssetModalProps) {
  const [expiresIn, setExpiresIn] = useState(3600);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSignedUrl(null);
      setExpiresAt(null);
      setIsCopied(false);
      setExpiresIn(3600);
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsLoading(true);
    let finalExpiresIn = expiresIn;

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
        toast.info('Maximum expiration capped at 7 days for security compliance.');
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
      setSignedUrl(response.url);
      setExpiresAt(response.expires_at);
      toast.success('Signed URL generated successfully!');
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      toast.error('Failed to generate shared link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (signedUrl) {
      navigator.clipboard.writeText(signedUrl);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0f111a] rounded-[32px] w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <GlobeAltIcon className="h-6 w-6 text-indigo-500" />
              Share Asset
            </h3>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate mt-1 max-w-[200px]" title={originalName}>
              {originalName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {!signedUrl ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ClockIcon className="h-3 w-3" />
                  Link Expiration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setExpiresIn(opt.value)}
                      className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        expiresIn === opt.value
                          ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:border-gray-200 dark:hover:border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {expiresIn === 0 && (
                  <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      Select Expiration Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    />
                  </div>
                )}
                
                <p className="text-[10px] text-gray-400 font-medium italic">
                  {expiresIn === 604800 
                    ? 'Maximum allowed link duration (7 days) for S3 security compliance.' 
                    : 'After this time, the direct link will become invalid.'}
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Generate Secure Link
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Signed Link Generated
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                    <p className="text-xs font-mono text-gray-900 dark:text-gray-200 break-all line-clamp-3">
                      {signedUrl}
                    </p>
                  </div>
                </div>
                {expiresAt && (
                   <p className="text-[10px] text-gray-400 font-medium text-center">
                     Valid until {new Date(expiresAt).toLocaleString()}
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
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSignedUrl(null)}
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
