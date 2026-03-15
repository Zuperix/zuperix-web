'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import AssetGrid from '@/components/AssetGrid';
import UploadModal from '@/components/UploadModal';
import MetadataPanel from '@/components/MetadataPanel';
import FilterSidebar from '@/components/FilterSidebar';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function DashboardContent() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [assets, setAssets] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Initialize filters from URL on mount
  useEffect(() => {
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      // Handle array params (multiple keys with same name)
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
    
    // Normalize string values that should be arrays if multiple expected
    const normalized: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => {
      // Basic heuristic: if it's one of these fields and not an array, make it an array
      if (['mime_type', 'file_extension', 'tags', 'orientation'].includes(k) && !Array.isArray(v)) {
        normalized[k] = [v];
      } else {
        normalized[k] = v;
      }
    });
    
    setActiveFilters(normalized);
  }, [searchParams]);

  const fetchAssets = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      
      const endpoint = `/workspaces/${activeWorkspace.id}/search/assets?${searchParams.toString()}`;
      
      // We expect the new envelope with results, pagination, filters
      const data = await apiFetch<any>(endpoint);
      setAssets(data.results || []);
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
    
    // Remote old values for this key
    params.delete(key);
    
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
    <div className="flex h-full -m-8">
      <FilterSidebar 
        filters={filters} 
        activeFilters={activeFilters} 
        onFilterChange={handleFilterChange} 
      />

      <div className={`flex-1 p-8 transition-all overflow-y-auto ${selectedAssetId ? 'pr-2' : ''}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assets</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Manage your digital assets in <span className="text-gray-800 dark:text-gray-300 font-medium">{activeWorkspace.name}</span></p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={fetchAssets}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Upload
              </button>
            </div>
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
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedAssetId(null);
              }}
            >
              <AssetGrid 
                assets={assets} 
                onDelete={handleDelete} 
                onSelect={(id) => setSelectedAssetId(id === selectedAssetId ? null : id)}
                selectedId={selectedAssetId || undefined}
              />
            </div>
          )}
        </div>
      </div>

      {selectedAssetId && (
        <MetadataPanel 
          assetId={selectedAssetId} 
          workspaceId={activeWorkspace.id} 
          onClose={() => setSelectedAssetId(null)}
        />
      )}

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
