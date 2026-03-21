'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  FolderIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

interface BulkAddCategoryModalProps {
  selectedIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkAddCategoryModal({ 
  selectedIds, 
  onClose, 
  onSuccess 
}: BulkAddCategoryModalProps) {
  const { activeWorkspace } = useWorkspace();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!activeWorkspace) return;
      try {
        const data = await apiFetch<any[]>(`/categories?workspace_id=${activeWorkspace.id}`);
        setCategories(data);
      } catch (error) {
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [activeWorkspace]);

  const handleSubmit = async () => {
    if (!selectedCategoryId || !activeWorkspace) return;
    try {
      setIsSubmitting(true);
      await apiFetch(`/categories/${selectedCategoryId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: selectedIds })
      });
      toast.success(`Added ${selectedIds.length} assets to category`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to add assets to category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Add to Category</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a category for {selectedIds.length} assets</p>
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
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedCategoryId === category.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 shadow-sm' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedCategoryId === category.id ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <FolderIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{category.name}</p>
                      <p className="text-[10px] opacity-60 uppercase tracking-widest">{category.path}</p>
                    </div>
                  </div>
                  {selectedCategoryId === category.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-500">No categories found in this workspace.</p>
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
            disabled={!selectedCategoryId || isSubmitting}
            className="flex-[2] px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {isSubmitting ? 'Adding...' : `Add to Category`}
          </button>
        </div>
      </div>
    </div>
  );
}
