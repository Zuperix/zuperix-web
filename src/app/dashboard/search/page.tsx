'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import AssetGrid from '@/components/AssetGrid';
import Pagination from '@/components/Pagination';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { useLayout } from '@/context/LayoutContext';

export default function SearchPage() {
  const { activeWorkspace } = useWorkspace();
  const { searchQuery, setSearchQuery } = useLayout();
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const handleSearch = useCallback(async (q: string, p: number, l: number) => {
    if (!activeWorkspace || !q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch<{ results: any[], pagination: { total_results: number, total_pages: number } }>(`/workspaces/${activeWorkspace.id}/search/assets?q=${encodeURIComponent(q)}&limit=${l}&page=${p}`);
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

  // Simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery, page, limit);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, page, limit, handleSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiFetch(`/assets/${id}`, { method: 'DELETE' });
      setResults(prev => prev.filter((a: any) => a.id !== id));
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-gray-50/50 dark:bg-[#0f111a] transition-all">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Search Results</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
              {searchQuery.trim() ? (
                <>Found <span className="text-gray-900 dark:text-gray-100 font-semibold">{results.length}</span> out of <span className="text-gray-900 dark:text-gray-100 font-semibold">{totalResults}</span> assets matching your query</>
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

        <div className="relative group max-w-3xl">
          <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-3xl group-focus-within:bg-blue-500/10 transition-all" />
          <div className="relative flex items-center bg-white dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-black/5 dark:shadow-none transition-all group-focus-within:ring-2 group-focus-within:ring-blue-500/20 group-focus-within:border-blue-500/40 overflow-hidden">
            <div className="pl-4 sm:pl-6 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <input
              type="text"
              className="flex-1 pl-3 sm:pl-4 pr-12 py-4 sm:py-6 bg-transparent outline-none text-base sm:text-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="Search filenames, tags, or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500/30 border-t-blue-500" />
              </div>
            )}
            {searchQuery && !loading && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
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
              <AssetGrid assets={results} onDelete={handleDelete} />
              
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
    </div>
  );
}
