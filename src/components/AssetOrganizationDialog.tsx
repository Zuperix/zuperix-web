'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  FolderIcon, 
  Square3Stack3DIcon,
  CheckIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useCategories, Category } from '@/hooks/useCategories';
import { useCollections, Collection } from '@/hooks/useCollections';
import { apiFetch } from '@/lib/api';

interface AssetOrganizationDialogProps {
  assetId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AssetOrganizationDialog({ 
  assetId, 
  isOpen, 
  onClose,
  onSuccess 
}: AssetOrganizationDialogProps) {
  const { categories, refresh: refreshCategories } = useCategories();
  const { collections, refresh: refreshCollections } = useCollections();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && assetId) {
      fetchCurrentAssignments();
    }
  }, [isOpen, assetId]);

  const fetchCurrentAssignments = async () => {
    try {
      setFetching(true);
      const assetData = await apiFetch<any>(`/assets/${assetId}`);
      setSelectedCategoryIds(assetData.categories?.map((c: any) => c.id) || []);
      setSelectedCollectionIds(assetData.collections?.map((c: any) => c.id) || []);
    } catch (err) {
      console.error('Failed to fetch current assignments');
    } finally {
      setFetching(false);
    }
  };

  const handleToggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleToggleCollection = (id: string) => {
    setSelectedCollectionIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiFetch(`/assets/${assetId}/organization`, {
        method: 'PUT',
        body: JSON.stringify({
          category_ids: selectedCategoryIds,
          collection_ids: selectedCollectionIds
        })
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save assignments');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in transition-all duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-950/50">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">Organize Asset</h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{assetId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 transition-all">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
          {fetching && (
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center gap-3">
              <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-xs text-gray-400 font-medium">Loading organization...</span>
            </div>
          )}

          {/* Categories Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Categories</h3>
              </div>
              <button 
                onClick={() => refreshCategories()}
                className="p-1 text-gray-600 hover:text-blue-400 transition-colors"
                title="Refresh Categories"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {flattenCategories(categories).map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedCategoryIds.includes(cat.id)
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 ring-1 ring-blue-500/20'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="text-[10px] w-4 opacity-50"
                      style={{ paddingLeft: `${cat.depth * 4}px` }}
                    >
                      {cat.depth > 0 && '└'}
                    </span>
                    <span className="text-xs font-semibold truncate">{cat.name}</span>
                  </div>
                  {selectedCategoryIds.includes(cat.id) ? (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-gray-700 group-hover:border-gray-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Collections Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Square3Stack3DIcon className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Collections</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => refreshCollections()}
                  className="p-1 text-gray-600 hover:text-indigo-400 transition-colors"
                  title="Refresh Collections"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                </button>
                <button className="p-1 hover:bg-gray-800 rounded-md text-gray-500 hover:text-indigo-400 transition-colors">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            {collections.length === 0 ? (
              <div className="text-center py-6 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                <p className="text-[10px] text-gray-500 italic uppercase">No collections created yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {collections.map(col => (
                  <div 
                    key={col.id}
                    onClick={() => handleToggleCollection(col.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedCollectionIds.includes(col.id)
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/20'
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    <span className="text-xs font-semibold truncate">{col.name}</span>
                    {selectedCollectionIds.includes(col.id) ? (
                      <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-gray-700 group-hover:border-gray-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-950/50 border-t border-gray-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-gray-800 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-700 transition-all border border-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || fetching}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Apply Changes'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  );
}

function flattenCategories(categories: Category[]): Category[] {
  let result: Category[] = [];
  categories.forEach(cat => {
    result.push(cat);
    if (cat.children) {
      result = result.concat(flattenCategories(cat.children));
    }
  });
  return result;
}
