'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import AssetGrid from '@/components/AssetGrid';
import MetadataPanel from '@/components/MetadataPanel';
import { 
  TrashIcon, 
  ArrowPathIcon, 
  ArrowUturnLeftIcon 
} from '@heroicons/react/24/outline';

export default function TrashPage() {
  const { activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const fetchTrash = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      // Assuming we have a way to list deleted assets. 
      // For now, let's assume the list assets endpoint supports a include_deleted or similar,
      // or we use a separate endpoint if we implemented one.
      // In the implementation plan, we added soft deletes.
      const data = await apiFetch<any[]>(`/assets?workspace_id=${activeWorkspace.id}&deleted=true`);
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch trash:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [activeWorkspace]);

  if (!activeWorkspace) return null;

  return (
    <div className="flex h-full -m-8">
      <div className={`flex-1 p-8 transition-all ${selectedAssetId ? 'pr-2' : ''}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <TrashIcon className="h-7 w-7 text-red-400" />
                Trash
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">Recover or permanently delete items from <span className="text-gray-300 font-medium">{activeWorkspace.name}</span></p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={fetchTrash}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-800 aspect-square rounded-xl"></div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
              <TrashIcon className="h-12 w-12 text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">Your trash is empty</p>
              <p className="text-gray-600 text-xs mt-1">Deleted items will appear here for 30 days</p>
            </div>
          ) : (
            <AssetGrid 
              assets={assets} 
              onDelete={(id) => {/* Handle permanent delete */}} 
              onSelect={(id) => setSelectedAssetId(id === selectedAssetId ? null : id)}
              selectedIds={selectedAssetId ? [selectedAssetId] : []}
            />
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
    </div>
  );
}
