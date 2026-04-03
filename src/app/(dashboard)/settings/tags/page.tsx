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
  SwatchIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteRequest = (tag: Tag) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!activeWorkspace || !tagToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      });
      setSuccess('Tag deleted successfully');
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (err: any) {
      setError('Failed to delete tag');
    } finally {
      setIsDeleting(false);
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
            href="/settings" 
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
                  className="group flex flex-col p-6 rounded-[32px] bg-gray-900/40 border border-gray-800/60 hover:border-indigo-500/30 hover:bg-gray-800/40 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 z-20">
                    <PermissionGate action={Action.Delete} subject="Tag" workspaceId={activeWorkspace.id}>
                        <button 
                            disabled={deletingId === tag.id}
                            onClick={() => handleDeleteRequest(tag)}
                            className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-50"
                            title="Purge Tag"
                        >
                            {deletingId === tag.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                        </button>
                    </PermissionGate>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TagIcon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                        {tag.name}
                      </h4>
                      <p className="text-[10px] font-mono text-gray-600 mt-0.5 truncate">{tag.slug}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-gray-800/60 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${tag.asset_count > 0 ? 'bg-indigo-400 animate-pulse' : 'bg-gray-700'}`} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                          {tag.asset_count} Assets
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-700 font-bold uppercase tracking-tighter">
                        {new Date(tag.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {tag.asset_count > 0 && (
                      <Link 
                        href={`/?tag_uuids=${tag.id}`}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 group/btn"
                      >
                        View
                        <ArrowRightIcon className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                  
                  {/* Visual flourish */}
                  <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setTagToDelete(null); }}
        onConfirm={confirmDelete}
        title="Purge Tag"
        message={`Are you sure you want to delete "${tagToDelete?.name}"? It will be removed from all associated assets. This action cannot be undone.`}
        confirmText="Purge Tag"
        isDeleting={isDeleting}
      />
    </div>
  );
}
