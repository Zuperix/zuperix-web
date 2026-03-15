'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import AssetGrid from '@/components/AssetGrid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { useLayout } from '@/context/LayoutContext';

export default function SearchPage() {
  const { activeWorkspace } = useWorkspace();
  const { searchQuery, setSearchQuery } = useLayout();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!activeWorkspace || !q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch<{ results: any[], total: number }>(`/workspaces/${activeWorkspace.id}/search?q=${encodeURIComponent(q)}`);
      setResults(data.results || []);
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
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Search Results</h1>
        <p className="text-gray-500 dark:text-gray-400">Showing results for your global search in {activeWorkspace?.name}</p>
      </div>

      <div className="relative max-w-2xl">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
          placeholder="Search for filenames, tags, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <div className="mt-8">
        {searchQuery.trim() && !loading && results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <AssetGrid assets={results} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
