'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import AssetGrid from '@/components/AssetGrid';
import MetadataPanel from '@/components/MetadataPanel';
import { 
  TrashIcon, 
  ArrowPathIcon, 
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

/**
 * Trash Management Page
 * Relocated to Settings dashboard. Items stay here for 30 days.
 */
export default function TrashSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const fetchTrash = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const data = await apiFetch<any[]>(`/assets?workspace_id=${activeWorkspace.id}&deleted=true`);
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch trash:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiFetch(`/assets/${id}/restore`, { method: 'POST' });
      toast.success('Asset restored successfully');
      fetchTrash();
    } catch (err) {
      toast.error('Failed to restore asset');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('This item will be permanently removed. This action cannot be undone. Are you sure?')) return;
    try {
      await apiFetch(`/assets/${id}/purge`, { method: 'DELETE' });
      toast.success('Asset permanently removed');
      fetchTrash();
    } catch (err) {
      toast.error('Failed to purge asset');
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [activeWorkspace]);

  if (!activeWorkspace) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/settings"
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="p-2 bg-red-500/10 rounded-xl">
            <TrashIcon className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trash Management</h1>
            <p className="text-sm text-gray-500">Items stay here for 30 days before being permanently removed.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={fetchTrash}
             className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-800 transition-all font-mono tracking-tighter"
           >
             <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             REFRESH
           </button>
           <button 
             className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all font-mono tracking-tighter"
             onClick={() => {/* Purge all logic - could add bulk purge here */}}
           >
             <TrashIcon className="h-4 w-4" />
             EMPTY TRASH
           </button>
        </div>
      </div>

      <div className="bg-gray-950/40 border border-gray-800/60 rounded-3xl min-h-[500px] flex flex-col backdrop-blur-xl relative overflow-hidden">
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="h-10 w-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                <div className="relative p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-2xl">
                   <SparklesIcon className="h-12 w-12 text-emerald-400" />
                </div>
             </div>
             <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Trash is completely empty</h3>
             <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
               Nice work! Your workspace is organized and clutter-free.
             </p>
          </div>
        ) : (
          <div className="p-8 relative z-10">
            <AssetGrid 
              assets={assets} 
              onDelete={handlePermanentDelete} 
              onRestore={handleRestore}
              onSelect={(id) => setSelectedAssetId(id === selectedAssetId ? null : id)}
              selectedIds={selectedAssetId ? [selectedAssetId] : []}
            />
          </div>
        )}
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
