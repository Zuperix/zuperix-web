'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import PublicAssetCard from './PublicAssetCard';
import { PhotoIcon } from '@heroicons/react/24/outline';
import WidgetRenderer from './portals/builder/WidgetRenderer';

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
  categories?: Array<{ id: string; name: string }>;
  collections?: Array<{ id: string; name: string }>;
  assets: Array<{
    id: string;
    name: string;
    type: string;
    thumbnail_url: string;
    download_url: string;
    category_ids?: string[];
    collection_ids?: string[];
  }>;
}

interface PublicPortalProps {
  slug: string;
  initialData?: PortalData | null;
  initialAssets?: {
    results: any[];
    pagination: any;
  } | null;
  initialError?: string | null;
}

export default function PublicPortal({ slug, initialData, initialAssets, initialError }: PublicPortalProps) {
  const [data, setData] = useState<PortalData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [error, setError] = useState<string | null>(initialError || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // OS Search & Pagination State
  const [searchResults, setSearchResults] = useState<any[]>(initialAssets?.results || []);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialAssets?.pagination?.total_pages || 1);
  const [totalResults, setTotalResults] = useState(initialAssets?.pagination?.total_results || 0);

  // 1. Initial portal config fetch (only if not SSR provided)
  useEffect(() => {
    if (initialData || initialError) return;

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
  }, [slug, initialData, initialError]);

  // 2. Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // 3. Manage server-side OS Search & Pagination
  useEffect(() => {
    if (loading || !data) return;

    // Skip the first fetch if we already have SSR initialAssets AND we are on page 1 with no query
    if (initialAssets && page === 1 && searchQuery.trim() === '' && searchResults.length === (initialAssets.results?.length || 0)) {
       return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryParam = searchQuery.trim() ? `&q=${encodeURIComponent(searchQuery)}` : '';
        const endpoint = `/p/${slug}/search?page=${page}&limit=20${queryParam}`;
        const response = await apiFetch<any>(endpoint);
        
        setSearchResults(response.results || []);
        if (response.pagination) {
           setTotalPages(response.pagination.total_pages || 1);
           setTotalResults(response.pagination.total_results || 0);
        }
      } catch (err) {
        console.error('Portal search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, page, slug, loading, data, initialAssets]);

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

  const hasLayout = data.settings?.layout && Array.isArray(data.settings.layout) && data.settings.layout.length > 0;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0f111a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Portal Header/Logo */}
        {data.settings?.logo_url && (
          <div className="mb-12 flex items-center justify-start">
            <img 
              src={data.settings.logo_url} 
              alt={data.name} 
              className="h-12 w-auto object-contain transition-all hover:scale-105" 
            />
          </div>
        )}

        {hasLayout ? (
          // Dynamic Builder Layout
          <div className="space-y-6 relative">
            {isSearching && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#fafafa]/50 dark:bg-[#0f111a]/50 backdrop-blur-sm rounded-3xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {data.settings.layout.map((widget: any) => (
              <div 
                key={widget.id} 
                className={widget.type === 'search' && widget.config.sticky ? 'sticky top-0 z-40' : ''}
              >
                 <WidgetRenderer 
                    widget={widget} 
                    isEditMode={false} 
                    context={{ 
                      assets: searchResults, // ALWAYS use OS search results!
                      categories: data.categories,
                      collections: data.collections,
                      searchQuery,
                      onSearchChange: setSearchQuery
                    }} 
                 />
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center py-8 gap-4">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isSearching}
                  className="px-6 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50 font-semibold"
                >
                  Previous
                </button>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Page <span className="text-black dark:text-white font-bold">{page}</span> of {totalPages}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isSearching}
                  className="px-6 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50 font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          // Legacy Layout Fallback
          <>
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
                <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 mb-2 overflow-hidden">
                  {data.settings?.logo_url ? (
                    <img src={data.settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
                  ) : (
                    <PhotoIcon className="h-10 w-10 text-white" />
                  )}
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
                      {totalResults} {totalResults === 1 ? 'Available Asset' : 'Available Assets'}
                    </span>
                  </div>
                </div>
              </div>

              {!data.banner_image_url && (
                <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
                  <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-white rounded-full blur-[120px]" />
                  <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[100px]" />
                </div>
              )}
            </header>

            <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Asset Library</h2>
                <div className="h-px flex-1 mx-8 bg-gray-200 dark:bg-gray-800" />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{totalResults} items total</p>
            </div>

            {searchResults.length > 0 ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {searchResults.map((asset: any) => (
                  <PublicAssetCard key={asset.id} asset={asset} />
                ))}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center py-8 gap-4 mt-8">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isSearching}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 disabled:opacity-50 font-semibold"
                  >
                    Previous
                  </button>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Page <span className="text-black dark:text-white font-bold">{page}</span> of {totalPages}
                  </div>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isSearching}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 disabled:opacity-50 font-semibold"
                  >
                    Next
                  </button>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">This portal has no assets yet.</p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-600">
            Powered by <span className="font-bold text-gray-900 dark:text-gray-400 tracking-tight">Zuperix</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
