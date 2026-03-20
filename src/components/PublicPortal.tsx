'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import PublicAssetCard from './PublicAssetCard';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface PortalData {
  name: string;
  description: string | null;
  welcome_title: string | null;
  cta_text: string | null;
  cta_url: string | null;
  cta_button_color: string | null;
  banner_image_url: string | null;
  background_color: string | null;
  settings: any;
   assets: Array<{
    id: string;
    name: string;
    type: string;
    thumbnail_url: string;
    download_url: string;
  }>;
}

export default function PublicPortal({ slug }: { slug: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortal() {
      try {
        const response = await apiFetch<PortalData>(`/p/${slug}`);
        setData(response);
      } catch (err: any) {
        console.error('Failed to fetch portal:', err);
        setError(err.message || 'Failed to load portal');
      } finally {
        setLoading(false);
      }
    }
    fetchPortal();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/30">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Portal Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">{error || "The portal you're looking for doesn't exist or has been removed."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f111a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Custom Hero Section */}
        <header 
          className="relative mb-16 rounded-[48px] overflow-hidden min-h-[400px] flex flex-col justify-center px-12 py-16 transition-all shadow-2xl shadow-black/10"
          style={{ 
            backgroundColor: data.background_color || '#2563eb',
            backgroundImage: data.banner_image_url ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${data.banner_image_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="relative z-10 max-w-3xl space-y-8">
            <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 mb-2">
              <PhotoIcon className="h-10 w-10 text-white" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                {data.welcome_title || data.name}
              </h1>
              {data.description && (
                <p className="text-xl text-white/80 max-w-2xl leading-relaxed font-medium">
                  {data.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {data.cta_text && data.cta_url && (
                <a 
                  href={data.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-black/20 active:scale-95 text-center"
                  style={{ 
                    backgroundColor: data.cta_button_color || '#ffffff',
                    color: data.cta_button_color ? '#ffffff' : '#000000' 
                  }}
                >
                  {data.cta_text}
                </a>
              )}
              
              <div className="flex items-center gap-3 px-6 py-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">
                  {data.assets.length} {data.assets.length === 1 ? 'Available Asset' : 'Available Assets'}
                </span>
              </div>
            </div>
          </div>

          {/* Abstract blobs for aesthetics if no image */}
          {!data.banner_image_url && (
            <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-white rounded-full blur-[120px]" />
              <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[100px]" />
            </div>
          )}
        </header>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Asset Library</h2>
            <div className="h-px flex-1 mx-8 bg-gray-200 dark:bg-gray-800" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{data.assets.length} items total</p>
        </div>

        {/* Assets Grid */}
        {data.assets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {data.assets.map((asset) => (
              <PublicAssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">This portal has no assets yet.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-600">
            Powered by <span className="font-bold text-gray-900 dark:text-gray-400 tracking-tight">Open DAM</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
