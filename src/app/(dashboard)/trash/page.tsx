'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import AssetGrid from '@/components/AssetGrid';
import MetadataPanel from '@/components/MetadataPanel';
import Pagination from '@/components/Pagination';
import { 
  TrashIcon, 
  ArrowPathIcon, 
} from '@heroicons/react/24/outline';

export default function TrashPage() {
  const { activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTrash = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        page: page.toString(),
        limit: limit.toString(),
      });
      const data = await apiFetch<any>(`/assets/trash?${params.toString()}`);
      setAssets(data.assets || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch trash:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiFetch(`/assets/${id}/restore`, { method: 'POST' });
      fetchTrash();
    } catch (err) {
      console.error('Failed to restore asset:', err);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [activeWorkspace, page, limit]);

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
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-900 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                {[20, 50, 100].map(size => (
                  <option key={size} value={size}>{size} PER PAGE</option>
                ))}
              </select>
              <button 
                onClick={fetchTrash}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading && assets.length === 0 ? (
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
            <>
              <AssetGrid 
                assets={assets} 
                onDelete={(id) => {/* Handle permanent delete */}} 
                onRestore={handleRestore}
                onSelect={(id) => setSelectedAssetId(id === selectedAssetId ? null : id)}
                selectedIds={selectedAssetId ? [selectedAssetId] : []}
                loading={loading}
              />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
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

