'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import AssetGrid from '@/components/AssetGrid';
import Pagination from '@/components/Pagination';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SearchPage() {
  const { activeWorkspace } = useWorkspace();
  const { searchQuery, setSearchQuery } = useLayout();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSemantic, setIsSemantic] = useState(searchParams.get('is_semantic') === 'true');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(async (q: string, p: number, l: number, s: boolean) => {
    if (!activeWorkspace || !q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch<{ results: any[], pagination: { total_results: number, total_pages: number } }>(
        `/workspaces/${activeWorkspace.id}/search/assets?q=${encodeURIComponent(q)}&limit=${l}&page=${p}${s ? '&is_semantic=true' : ''}`
      );
      setResults(data.results || []);
      setTotalResults(data.pagination?.total_results || 0);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  // Sync state from URL on mount or param change
  useEffect(() => {
    const semanticParam = searchParams.get('is_semantic') === 'true';
    if (semanticParam !== isSemantic) {
      setIsSemantic(semanticParam);
    }
  }, [searchParams]);

  // Simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery, page, limit, isSemantic);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, page, limit, isSemantic, handleSearch]);

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/assets/${assetToDelete}`, { method: 'DELETE' });
      setResults(prev => prev.filter((a: any) => a.id !== assetToDelete));
      setDeleteModalOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      alert('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setAssetToDelete(id);
    setDeleteModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-gray-50/50 dark:bg-[#0f111a] transition-all">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Search Results</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
              {searchQuery.trim() ? (
                <>
                  Found <span className="text-gray-900 dark:text-gray-100 font-semibold">{results.length}</span> out of <span className="text-gray-900 dark:text-gray-100 font-semibold">{totalResults}</span> assets matching your query
                  {isSemantic && <span className="ml-2 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-500 text-[10px] font-medium rounded-full border border-amber-200/50 dark:border-amber-800/30 transition-all animate-pulse">AI can make mistakes</span>}
                </>
              ) : (
                <>Find anything across your workspace</>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <select 
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none px-3 py-2 bg-white dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all shadow-sm"
            >
              {[20, 50, 100, 500].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        </div>


        <div className="pt-4">
          {searchQuery.trim() && !loading && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                <MagnifyingGlassIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No assets found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                We couldn&apos;t find any assets matching &quot;{searchQuery}&quot;. Try adjusting your keywords or filters.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-8 px-6 py-2.5 bg-gray-900 dark:bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-700 transition-all shadow-lg active:scale-95"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AssetGrid 
                assets={results} 
                onDelete={handleDeleteTrigger} 
                onSelect={(id) => router.push(`/dashboard/assets/${id}`)}
              />
              
              <div className="mt-8 border-t border-gray-100 dark:border-gray-800/60 pt-4">
                <Pagination 
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Delete Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
