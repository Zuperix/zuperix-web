'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  Square3Stack3DIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

interface BulkAddCollectionModalProps {
  selectedIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkAddCollectionModal({ 
  selectedIds, 
  onClose, 
  onSuccess 
}: BulkAddCollectionModalProps) {
  const { activeWorkspace } = useWorkspace();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!activeWorkspace) return;
      try {
        const data = await apiFetch<any[]>(`/collections?workspace_id=${activeWorkspace.id}`);
        setCollections(data);
      } catch (error) {
        toast.error('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [activeWorkspace]);

  const handleSubmit = async () => {
    if (!selectedCollectionId || !activeWorkspace) return;
    try {
      setIsSubmitting(true);
      await apiFetch(`/collections/${selectedCollectionId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: selectedIds })
      });
      toast.success(`Added ${selectedIds.length} assets to collection`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to add assets to collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Add to Collection</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a collection for {selectedIds.length} assets</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollectionId(collection.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedCollectionId === collection.id 
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 shadow-sm' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedCollectionId === collection.id ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Square3Stack3DIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{collection.name}</p>
                        {collection.is_global && (
                          <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                            <GlobeAmericasIcon className="h-2 w-2" />
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] opacity-60 truncate max-w-[200px]">{collection.description || 'No description'}</p>
                    </div>
                  </div>
                  {selectedCollectionId === collection.id && (
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                  )}
                </button>
              ))}
              {collections.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-500">No collections found.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCollectionId || isSubmitting}
            className="flex-[2] px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            {isSubmitting ? 'Adding...' : `Add to Collection`}
          </button>
        </div>
      </div>
    </div>
  );
}
