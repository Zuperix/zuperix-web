'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  TagIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';

interface Tag {
  id: string;
  name: string;
  slug: string;
  asset_count: number;
  created_at: string;
}

export default function TagsManagementPage() {
  const { activeWorkspace } = useWorkspace();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const data = await apiFetch<Tag[]>(`/workspaces/${activeWorkspace.id}/tags`);
      setTags(data);
    } catch (err: any) {
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleDelete = async (tagId: string) => {
    if (!activeWorkspace || !confirm('Are you sure you want to delete this tag? It will be removed from all associated assets.')) return;
    
    try {
      setDeletingId(tagId);
      await apiFetch(`/workspaces/${activeWorkspace.id}/tags/${tagId}`, {
        method: 'DELETE',
      });
      setSuccess('Tag deleted successfully');
      fetchTags();
    } catch (err: any) {
      setError('Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-gray-400">Loading workspace context...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link 
            href="/dashboard/settings" 
            className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 transition-colors group"
          >
            <ChevronLeftIcon className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <TagIcon className="h-6 w-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tags & Labels</h1>
          </div>
          <p className="text-gray-400 mt-2 text-sm italic">Clean up your library and see how your tags are being used.</p>
        </div>

        <div className="relative group w-full md:w-80">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a tag..."
                className="w-full bg-gray-900/40 border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
            />
        </div>
      </div>

      <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-300">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
              {error}
              <button className="ml-auto text-xs font-bold opacity-50 hover:opacity-100" onClick={() => setError('')}>Dismiss</button>
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm animate-in slide-in-from-top duration-300">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              {success}
              <button className="ml-auto text-xs font-bold opacity-50 hover:opacity-100" onClick={() => setSuccess('')}>Dismiss</button>
            </div>
          )}

          {loading && tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 bg-gray-900/20 border border-gray-800 rounded-[40px] border-dashed">
              <ArrowPathIcon className="h-10 w-10 text-blue-500/20 animate-spin mb-4" />
              <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Scanning Catalog...</p>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 bg-gray-900/20 border border-gray-800 rounded-[40px] border-dashed text-center">
              <div className="p-4 bg-gray-800/40 rounded-full mb-4">
                <SwatchIcon className="h-10 w-10 text-gray-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-500 mb-1">No tags found</h3>
              <p className="text-gray-600 text-xs max-w-xs mx-auto">Either you haven't tagged any assets yet, or no tags match your current search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTags.map(tag => (
                <div 
                  key={tag.id} 
                  className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 hover:bg-gray-800/50 hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl">
                            <TagIcon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{tag.name}</h4>
                            <p className="text-[10px] font-mono text-gray-600 mt-0.5">{tag.slug}</p>
                            
                            <div className="mt-4 flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    tag.asset_count > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-800 text-gray-600 border border-gray-700'
                                }`}>
                                    {tag.asset_count} Assets
                                </span>
                                <span className="text-[9px] text-gray-700 font-bold uppercase tracking-tighter">
                                    Created {new Date(tag.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <PermissionGate action={Action.Delete} subject="Tag" workspaceId={activeWorkspace.id}>
                        <button 
                            disabled={deletingId === tag.id}
                            onClick={() => handleDelete(tag.id)}
                            className="p-3 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Purge Tag"
                        >
                            {deletingId === tag.id ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <TrashIcon className="h-5 w-5" />}
                        </button>
                    </PermissionGate>
                  </div>
                  
                  {/* Subtle decorative element */}
                  <div className="absolute -right-2 -bottom-2 h-16 w-16 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
