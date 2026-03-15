'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import AssetGrid from '@/components/AssetGrid';
import UploadModal from '@/components/UploadModal';
import MetadataPanel from '@/components/MetadataPanel';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const data = await apiFetch<any[]>(`/assets?workspace_id=${activeWorkspace.id}`);
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
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
      <div className={`flex-1 p-8 transition-all ${selectedAssetId ? 'pr-2' : ''}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">Assets</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage all your digital assets in {activeWorkspace.name}</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={fetchAssets}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Asset
              </button>
            </div>
          </div>

          {loading && assets.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 aspect-square rounded-xl"></div>
              ))}
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
