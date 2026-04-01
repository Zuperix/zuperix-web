'use client';

import { useState, useEffect } from 'react';
import { apiFetch, BASE_URL } from '@/lib/api';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  DocumentIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SimilarAsset {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  asset_live_url?: string;
}

type SimilarityType = 'metadata' | 'visual';

const getIcon = (mime: string) => {
  if (mime.startsWith('image/')) return PhotoIcon;
  if (mime.startsWith('video/')) return VideoCameraIcon;
  return DocumentIcon;
};

export default function SimilarAssets({ assetId }: { assetId: string }) {
  const [data, setData] = useState<{ metadata: SimilarAsset[], visual: SimilarAsset[] }>({ metadata: [], visual: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SimilarityType>('metadata');

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setLoading(true);
        // Fetch both in one request
        const result = await apiFetch<{ metadata: SimilarAsset[], visual: SimilarAsset[] }>(
            `/assets/${assetId}/similar/unified?limit=10`
        );
        setData(result);
      } catch (err) {
        console.error('Failed to fetch similar assets', err);
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchSimilar();
    }
  }, [assetId]);

  const activeAssets = activeTab === 'metadata' ? data.metadata : data.visual;

  if (loading) {
    return (
      <div className="mt-16 space-y-6">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            {[1, 2].map(i => <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />)}
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[260px] aspect-[4/3] bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Only show if at least one tab has assets
  if (data.metadata.length === 0 && data.visual.length === 0) return null;

  return (
    <section className="mt-16 mb-20 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                Discovery
            </h3>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900/40 rounded-xl w-fit">
            <button
                onClick={() => setActiveTab('metadata')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'metadata' 
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                <TagIcon className="h-3.5 w-3.5" />
                By Metadata
            </button>
            <button
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'visual' 
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                <SparklesIcon className="h-3.5 w-3.5" />
                By Appearance
            </button>
        </div>
      </div>

      <div className="relative group">
        {activeAssets.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-2xl">
                    <SparklesIcon className="h-6 w-6 text-gray-300 dark:text-gray-700" />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No similar assets found</p>
                <p className="text-[9px] text-gray-500">Try adding more tags or AI labels to improve discovery.</p>
            </div>
        ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth snap-x">
            {activeAssets.map((asset) => {
                const Icon = getIcon(asset.mime_type);
                const isImage = asset.mime_type.startsWith('image/');

                return (
                <Link
                    key={asset.id}
                    href={`/assets/${asset.id}`}
                    className="min-w-[260px] max-w-[260px] group/card snap-start flex flex-col bg-white dark:bg-[#151720] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl transition-all duration-500"
                >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 dark:bg-gray-950/50">
                    {isImage ? (
                        <img
                        src={asset.asset_live_url}
                        alt={asset.original_name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-1000 ease-out"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 group-hover/card:scale-110 transition-transform duration-500">
                                <Icon className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="px-5 py-2.5 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500">
                        View Details
                        </span>
                    </div>
                    </div>

                    <div className="p-5 flex flex-col justify-between h-[84px]">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate leading-tight group-hover/card:text-blue-500 transition-colors">
                            {asset.original_name}
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-800">
                                {asset.mime_type.split('/')[1] || 'FILE'}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400">
                                {asset.size > 0 ? (asset.size / 1024).toFixed(0) + ' KB' : ''}
                            </span>
                        </div>
                    </div>
                </Link>
                );
            })}
            </div>
        )}
      </div>
    </section>
  );
}
