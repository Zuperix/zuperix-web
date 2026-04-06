'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  TrashIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { apiFetch, BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import CustomImage from './CustomImage';

interface DuplicateGroup {
  type: 'exact' | 'near';
  assets: any[];
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DuplicateFinderModal({
  workspaceId,
  onClose,
  onRefresh,
}: {
  workspaceId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<DuplicateGroup[]>(`/assets/duplicates?workspace_id=${workspaceId}`);
      setGroups(data || []);
    } catch (err) {
      console.error('Failed to fetch duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [workspaceId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this duplicate?')) return;
    try {
      setDeletingId(id);
      await apiFetch(`/assets/${id}`, { method: 'DELETE' });
      
      // Update local state
      setGroups(prev => prev.map(group => ({
        ...group,
        assets: group.assets.filter(a => a.id !== id)
      })).filter(group => group.assets.length > 1));
      
      onRefresh();
    } catch (err) {
      toast.error('Failed to delete asset');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-800 flex-shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold dark:text-white">Workspace Duplicate Scanner</h2>
              <p className="text-xs text-gray-500 mt-0.5">Scanning for identical and near-matching images</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-gray-500">Scanning workspace assets...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Workspace is clean!</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">No duplicates were found in your library. Everything looks organized.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8">
                {groups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest ${
                          group.type === 'exact' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                          {group.type === 'exact' ? 'Exact Match' : 'Near Duplicate'}
                        </span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">— {group.assets.length} items found</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.assets.map((asset) => (
                        <div 
                          key={asset.id}
                          className="group relative bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-3 hover:shadow-xl hover:shadow-black/5 transition-all"
                        >
                          <div className="aspect-square bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border dark:border-gray-800 relative shadow-inner">
                            {asset.mimeType?.startsWith('image/') ? (
                              <CustomImage 
                                src={asset.thumbnail_lg_url || asset.asset_live_url}
                                fill
                                alt={asset.originalName}
                                className="object-cover transition-transform group-hover:scale-105 duration-500"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <DocumentIcon className="h-12 w-12 text-gray-200 dark:text-gray-800" />
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <p className="text-xs font-bold dark:text-white truncate" title={asset.originalName}>
                              {asset.originalName}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-gray-500 font-medium">
                                {formatSize(asset.size)} • {new Date(asset.createdAt).toLocaleDateString()}
                              </p>
                              <button 
                                onClick={() => handleDelete(asset.id)}
                                disabled={deletingId === asset.id}
                                className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                              >
                                {deletingId === asset.id ? (
                                  <div className="h-3 w-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                ) : (
                                  <TrashIcon className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-between gap-3 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            Manual review suggested before deletion
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
