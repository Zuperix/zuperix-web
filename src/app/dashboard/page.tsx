'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import AssetGrid from '@/components/AssetGrid';
import UploadModal from '@/components/UploadModal';
import MetadataPanel from '@/components/MetadataPanel';
import FilterSidebar from '@/components/FilterSidebar';
import { PlusIcon, ArrowPathIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import Pagination from '@/components/Pagination';
import { useLayout } from '@/context/LayoutContext';

function FilterChips({ 
  activeFilters, 
  filters,
  onRemove, 
  onClearAll 
}: { 
  activeFilters: Record<string, any>, 
  filters: any,
  onRemove: (key: string, value?: any) => void, 
  onClearAll: () => void 
}) {
  const filterLabels: Record<string, string> = {
    mime_type: 'File Type',
    orientation: 'Orientation',
    tags: 'Tag',
    file_extension: 'Extension',
    color_palette: 'Color',
    category_uuids: 'Category',
    collection_uuids: 'Collection',
    q: 'Search',
    created_at: 'Uploaded',
    release_date: 'Released',
    expiration_date: 'Expires',
  };

  const chips: { key: string; label: string; value: any; displayValue: string }[] = [];

  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return;
    
    if (key.startsWith('ws') || key === 'page' || key === 'limit') return;

    const label = filterLabels[key] || (key.startsWith('metadata.') ? key.split('.')[1].replace(/_/g, ' ') : key);
    
    if (Array.isArray(value)) {
      value.forEach(v => {
        // Try to find label in facets
        let displayValue = String(v);
        const facetBuckets = filters[key];
        if (Array.isArray(facetBuckets)) {
          const bucket = facetBuckets.find(b => b.value === v);
          if (bucket?.label) {
            displayValue = bucket.label;
          }
        }

        chips.push({ 
          key, 
          label, 
          value: v, 
          displayValue: key === 'color_palette' ? '' : displayValue
        });
      });
    } else if (key.endsWith('[gte]') || key.endsWith('[lte]')) {
      const baseKey = key.replace(/\[(gte|lte)\]/, '');
      const type = key.includes('gte') ? 'Min' : 'Max';
      const baseLabel = filterLabels[baseKey] || baseKey;
      chips.push({ key, label: `${baseLabel} (${type})`, value, displayValue: String(value) });
    } else {
      // Try to find label in facets for non-array values
      let displayValue = String(value);
      const facetBuckets = filters[key];
      if (Array.isArray(facetBuckets)) {
        const bucket = facetBuckets.find(b => b.value === value);
        if (bucket?.label) {
          displayValue = bucket.label;
        }
      }
      chips.push({ key, label, value, displayValue });
    }
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {chips.map((chip, i) => (
        <div 
          key={`${chip.key}-${chip.value}-${i}`}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-full shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{chip.label}:</span>
          {chip.key === 'color_palette' ? (
            <div className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: chip.value }} />
          ) : (
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{chip.displayValue}</span>
          )}
          <button 
            onClick={() => onRemove(chip.key, chip.value)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button 
        onClick={onClearAll}
        className="px-3 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors uppercase tracking-tight"
      >
        Clear all
      </button>
    </div>
  );
}


function DashboardContent() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const limit = Number(searchParams.get('limit')) || 20;
  
  const [assets, setAssets] = useState<any[]>([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [totalInWorkspace, setTotalInWorkspace] = useState(0);
  const [pagination, setPagination] = useState<{ page: number, total_pages: number }>({ page: 1, total_pages: 1 });
  const [currentSort, setCurrentSort] = useState<{ by: string; order: 'asc' | 'desc' }>({
    by: searchParams.get('sort_by') || 'created_at',
    order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
  });
  const [filters, setFilters] = useState<any>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { sidebarCollapsed, setSidebarCollapsed, isFilterOpen, setIsFilterOpen } = useLayout();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });
    
    const normalized: Record<string, any> = {};
    const arrayKeys = ['mime_type', 'file_extension', 'tags', 'orientation', 'color_palette', 'category_uuids', 'collection_uuids'];
    Object.entries(params).forEach(([k, v]) => {
      if (arrayKeys.includes(k) && !Array.isArray(v)) {
        normalized[k] = [v];
      } else {
        normalized[k] = v;
      }
    });
    
    setActiveFilters(normalized);
    
    setCurrentSort({
      by: searchParams.get('sort_by') || 'created_at',
      order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    });
  }, [searchParams]);

  const fetchAssets = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      
      const endpoint = `/workspaces/${activeWorkspace.id}/search/assets?${searchParams.toString()}`;
      
      // We expect the new envelope with results, pagination, filters
      const data = await apiFetch<any>(endpoint);
      setAssets(data.results || []);
      setTotalMatching(data.pagination?.total_results || data.results?.length || 0);
      setTotalInWorkspace(data.pagination?.workspace_total || 0);
      setPagination({
        page: data.pagination?.page || 1,
        total_pages: data.pagination?.total_pages || 1
      });
      setFilters(data.filters || {});
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace, searchParams]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFilterChange = (key: string, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.delete(key);
    // Reset page on filter change
    params.delete('page');
    
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    }
    
    const query = params.toString();
    router.replace(`/dashboard${query ? `?${query}` : ''}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.replace(`/dashboard?${params.toString()}`);
  };

  const handleSortChange = (option: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort_by', option.sort_by);
    params.set('sort_order', option.sort_order);
    params.set('page', '1'); // Reset to page 1 on sort change
    router.replace(`/dashboard?${params.toString()}`);
  };

  const handleClearAll = () => {
    router.replace('/dashboard');
  };

  const removeFilter = (key: string, value?: any) => {
    if (value === undefined) {
      handleFilterChange(key, undefined);
      return;
    }

    const current = activeFilters[key];
    if (Array.isArray(current)) {
      const updated = current.filter(v => v !== value);
      handleFilterChange(key, updated.length > 0 ? updated : undefined);
    } else {
      handleFilterChange(key, undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      // Deleting uses the original assets endpoint
      await apiFetch(`/assets/${id}`, { method: 'DELETE' });
      setAssets(prev => prev.filter((a: any) => a.id !== id));
      if (selectedAssetId === id) setSelectedAssetId(null);
    } catch (error) {
      alert('Failed to delete asset');
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please select or create a workspace to continue</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <FilterSidebar 
        filters={filters} 
        activeFilters={activeFilters} 
        onFilterChange={handleFilterChange} 
        onClearAll={handleClearAll}
      />

      <div className={`flex-1 p-4 sm:p-8 transition-all overflow-y-auto`}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Assets</h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                  Showing <span className="text-gray-900 dark:text-gray-100 font-semibold">{assets.length}</span> out of <span className="text-gray-900 dark:text-gray-100 font-semibold">{totalMatching}</span> assets
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <select 
                    value={limit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('limit', newLimit.toString());
                      params.set('page', '1');
                      router.push(`${pathname}?${params.toString()}`);
                    }}
                    className="appearance-none px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all"
                  >
                    {[20, 50, 100, 500].map(size => (
                      <option key={size} value={size}>{size} per page</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden flex-1 flex items-center justify-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shrink-0"
                  >
                    <FunnelIcon className="h-3.5 w-3.5 mr-1.5" />
                    Filters
                  </button>
                  <button 
                    onClick={fetchAssets}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-700 sm:border-transparent rounded-xl transition-all shrink-0"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <SortDropdown 
                    currentSortBy={currentSort.by}
                    currentSortOrder={currentSort.order}
                    onSortChange={handleSortChange}
                  />
                  <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Upload
                  </button>
                </div>
              </div>
            </div>

            <FilterChips 
              activeFilters={activeFilters} 
              filters={filters}
              onRemove={removeFilter} 
              onClearAll={handleClearAll} 
            />
          </div>

          {loading && assets.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 aspect-square rounded-xl"></div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No assets found for these filters.</p>
            </div>
          ) : (
            <div>
              <AssetGrid 
                assets={assets} 
                onDelete={handleDelete} 
                onSelect={(id) => router.push(`/dashboard/assets/${id}`)}
              />
              
              <Pagination 
                currentPage={pagination.page} 
                totalPages={pagination.total_pages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </div>
      </div>

      {isUploadOpen && (
        <UploadModal 
          workspaceId={activeWorkspace.id} 
          onClose={() => setIsUploadOpen(false)} 
          onSuccess={fetchAssets}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
