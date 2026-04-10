'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon, LinkIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface LinkData {
  id: string;
  token: string;
  workspace_id: string;
  created_by: string;
  max_uploads: number | null;
  current_uploads: number;
  allowed_types: string[] | null;
  max_file_size: number | null;
  category_id: string | null;
  tags: string[] | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ManageGuestLinksModal({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Super admin logic 
  const isSuperAdmin = user?.system_role === 'SUPER_ADMIN';

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<LinkData[]>(`/guest-uploads/links?workspace_id=${workspaceId}`);
      // Filter if not superadmin: only show links created by the current user
      if (!isSuperAdmin) {
        setLinks(data.filter(l => l.created_by === user?.id));
      } else {
        setLinks(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load guest links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [workspaceId, isSuperAdmin, user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link? Guests will immediately lose access.')) return;
    try {
      await apiFetch(`/guest-uploads/links/${id}`, { method: 'DELETE' });
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert('Failed to delete link');
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await apiFetch(`/guest-uploads/links/${id}/disable`, { method: 'POST' });
      setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: false } : l));
    } catch (err) {
      alert('Failed to disable link');
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/guest-uploads/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold dark:text-white">Manage Guest Links</h2>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">
                {isSuperAdmin ? 'Viewing All Workspace Links' : 'Viewing Your Created Links'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] bg-gray-50 dark:bg-gray-900/50 p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <LinkIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active upload links found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {links.map(link => (
                <div key={link.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        link.is_active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {link.is_active ? 'Active' : 'Disabled'}
                      </span>
                      {link.expires_at && new Date(link.expires_at) < new Date() && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          Expired
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-gray-500">
                        Created {new Date(link.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <div>
                        Uploads: <span className="text-gray-900 dark:text-gray-200 font-bold">{link.current_uploads}</span> 
                        {link.max_uploads ? ` / ${link.max_uploads}` : ' (Unlimited)'}
                      </div>

                      {link.expires_at && (
                        <div>
                           Expires: <span className="text-gray-900 dark:text-gray-200 font-bold">{new Date(link.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {link.allowed_types && !link.allowed_types.includes('all') && (
                        <div className="hidden md:block">
                           Types: <span className="text-gray-900 dark:text-gray-200 font-bold">{link.allowed_types.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                      onClick={() => copyToClipboard(link.token)}
                      className="flex items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedToken === link.token ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <DocumentDuplicateIcon className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                      )}
                    </button>
                    {link.is_active && (
                      <button
                        onClick={() => handleDisable(link.id)}
                        className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 rounded-lg transition-colors border border-amber-200/50 dark:border-amber-800/50"
                      >
                        Disable
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      title="Delete Link"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
