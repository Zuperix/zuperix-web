'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  LinkIcon, 
  TrashIcon, 
  PencilIcon, 
  EyeIcon, 
  LockClosedIcon, 
  LockOpenIcon, 
  ArrowDownTrayIcon, 
  ChevronLeftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface ShareLinkItem {
  id: string;
  workspace_id: string;
  title: string | null;
  description: string | null;
  type: string;
  asset_ids: string[] | null;
  category_id: string | null;
  password_hash: string | null;
  expires_at: string | null;
  views_count: number;
  allow_download: boolean;
  created_at: string;
  updated_at: string;
}

export default function ShareLinksManagementPage() {
  const { activeWorkspace } = useWorkspace();
  const [shareLinks, setShareLinks] = useState<ShareLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Clipboard copied feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion / Revocation states
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Edit modal states
  const [editingLink, setEditingLink] = useState<ShareLinkItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAllowDownload, setEditAllowDownload] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [editClearPassword, setEditClearPassword] = useState(false);
  const [editExpiryOption, setEditExpiryOption] = useState<string>('keep'); // 'keep', 'never', '3600', '86400', '604800', '2592000'
  const [savingEdit, setSavingEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const fetchShareLinks = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch<ShareLinkItem[]>(`/share-links?workspace_id=${activeWorkspace.id}`);
      setShareLinks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load share links');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchShareLinks();
  }, [fetchShareLinks]);

  const handleCopyLink = (id: string) => {
    const shareBase = process.env.NEXT_PUBLIC_SHARE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const shareUrl = `${shareBase}/s/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (id: string) => {
    setLinkToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!linkToDelete) return;
    setRevokingId(linkToDelete);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/share-links/${linkToDelete}`, {
        method: 'DELETE',
      });
      setSuccess('Share link has been successfully revoked and deactivated.');
      fetchShareLinks();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke share link');
    } finally {
      setRevokingId(null);
      setLinkToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const openEditModal = (link: ShareLinkItem) => {
    setEditingLink(link);
    setEditTitle(link.title || '');
    setEditDescription(link.description || '');
    setEditAllowDownload(link.allow_download);
    setEditPassword('');
    setEditClearPassword(false);
    setEditExpiryOption('keep');
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;
    setSavingEdit(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = {
        title: editTitle,
        description: editDescription,
        allow_download: editAllowDownload,
      };

      if (editClearPassword) {
        payload.password = '';
      } else if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      if (editExpiryOption === 'never') {
        payload.expires_in = null;
      } else if (editExpiryOption !== 'keep') {
        payload.expires_in = parseInt(editExpiryOption, 10);
      }

      await apiFetch(`/share-links/${editingLink.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setSuccess('Share link updated successfully.');
      setEditingLink(null);
      fetchShareLinks();
    } catch (err: any) {
      setError(err.message || 'Failed to update share link');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredShareLinks = shareLinks.filter(link => {
    const titleMatch = (link.title || 'Untitled Share').toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = link.type.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (link.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || typeMatch || descMatch;
  });

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-medium">Loading workspace context...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link 
            href="/settings" 
            className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 transition-colors hover:text-white group"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <LinkIcon className="h-6 w-6 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Share Links</h1>
          </div>
          <p className="text-gray-400 mt-2 text-sm max-w-xl leading-relaxed">
            Monitor, update permissions, or permanently revoke the active public shared asset links that you have generated.
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-teal-400 transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search share links..."
            className="w-full bg-gray-900/40 border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4 mb-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-300">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <div className="font-semibold">{error}</div>
            <button className="ml-auto text-xs font-bold opacity-50 hover:opacity-100" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm animate-in slide-in-from-top duration-300">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            <div className="font-semibold">{success}</div>
            <button className="ml-auto text-xs font-bold opacity-50 hover:opacity-100" onClick={() => setSuccess('')}>Dismiss</button>
          </div>
        )}
      </div>

      {/* Content Grid */}
      {loading && shareLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 bg-gray-900/20 border border-gray-800 rounded-[40px] border-dashed">
          <ArrowPathIcon className="h-10 w-10 text-teal-500/20 animate-spin mb-4" />
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Scanning Active Share Links...</p>
        </div>
      ) : filteredShareLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 bg-gray-900/20 border border-gray-800 rounded-[40px] border-dashed text-center">
          <div className="p-4 bg-gray-800/40 rounded-full mb-4">
            <GlobeAltIcon className="h-10 w-10 text-gray-700" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 mb-1">No active share links found</h3>
          <p className="text-gray-600 text-xs max-w-sm mx-auto leading-relaxed">
            You haven't generated any public share links in this workspace, or none match your search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShareLinks.map((link) => {
            const isExpired = link.expires_at ? new Date() > new Date(link.expires_at) : false;
            const assetCount = link.asset_ids ? link.asset_ids.length : 0;
            const fallbackTitle = link.title || 'Untitled Share';

            return (
              <div 
                key={link.id} 
                className="group flex flex-col p-6 rounded-[32px] bg-gray-900/40 border border-gray-800/60 hover:border-teal-500/30 hover:bg-gray-800/30 transition-all duration-300 relative overflow-hidden"
              >
                {/* Actions overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <button 
                    onClick={() => openEditModal(link)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 rounded-xl transition-all active:scale-95"
                    title="Edit Settings"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={revokingId === link.id}
                    onClick={() => handleRevoke(link.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                    title="Revoke & Deactivate Link"
                  >
                    {revokingId === link.id ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Card Title & Content */}
                <div className="mb-4">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    {/* Expiry Status Badge */}
                    {isExpired ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-wider">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                        Active
                      </span>
                    )}

                    {/* Share Link Type Badge */}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-800/80 border border-gray-700/60 text-gray-400 uppercase tracking-wider">
                      {link.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white tracking-tight leading-snug pr-16 truncate group-hover:text-teal-400 transition-colors">
                    {fallbackTitle}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
                    {link.description || 'No description provided.'}
                  </p>
                </div>

                {/* Info Badges */}
                <div className="grid grid-cols-2 gap-3.5 bg-gray-950/40 border border-gray-900 rounded-2xl p-3.5 mb-5 text-[11px] text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span>{link.views_count} {link.views_count === 1 ? 'view' : 'views'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {link.password_hash ? (
                      <>
                        <LockClosedIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="text-amber-500/90 font-semibold">Protected</span>
                      </>
                    ) : (
                      <>
                        <LockOpenIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <span>No Password</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowDownTrayIcon className={`h-4 w-4 flex-shrink-0 ${link.allow_download ? 'text-teal-500' : 'text-gray-600'}`} />
                    <span>Downloads: {link.allow_download ? 'Yes' : 'No'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span>
                      {link.type === 'category' ? 'Category Shared' : `${assetCount} assets`}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-auto pt-4 border-t border-gray-800/60 flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 font-mono">
                    Created {link.created_at ? new Date(link.created_at).toLocaleDateString() : 'N/A'}
                  </div>

                  <button
                    onClick={() => handleCopyLink(link.id)}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white border border-teal-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    {copiedId === link.id ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-3.5 w-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>

                {/* Visual Flourish background grid item glow */}
                <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-teal-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
              <PencilIcon className="h-5 w-5 text-teal-400" />
              Edit Share Link Settings
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Modify share link presentation settings or update credentials for this public route.
            </p>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Share Title
                </label>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Campaign Assets Q3"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Description / Subtext
                </label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief context displayed under the share title..."
                  rows={3}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Downloads & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allow Downloads Checkbox */}
                <div className="flex items-center justify-between bg-gray-950 border border-gray-800/80 p-3.5 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">Allow Downloads</span>
                    <span className="text-[9px] text-gray-500">Permit bulk and single asset saving</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={editAllowDownload}
                    onChange={(e) => setEditAllowDownload(e.target.checked)}
                    className="h-4.5 w-4.5 text-teal-600 focus:ring-teal-500 border-gray-800 rounded bg-gray-950 cursor-pointer"
                  />
                </div>

                {/* Expiry Extension Option */}
                <div className="flex flex-col bg-gray-950 border border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">Extend/Reset Expiry</span>
                  <select
                    value={editExpiryOption}
                    onChange={(e) => setEditExpiryOption(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1.5 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  >
                    <option value="keep">Keep Current Expiration</option>
                    <option value="never">Remove Expiration (Never Expires)</option>
                    <option value="3600">Extend by 1 Hour</option>
                    <option value="86400">Extend by 1 Day</option>
                    <option value="604800">Extend by 7 Days</option>
                    <option value="2592000">Extend by 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Password Protection */}
              <div className="bg-gray-950 border border-gray-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">Password Lock</span>
                    <span className="text-[9px] text-gray-500">Protect access with credentials</span>
                  </div>
                  {editingLink.password_hash && (
                    <button
                      type="button"
                      onClick={() => setEditClearPassword(!editClearPassword)}
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-all ${
                        editClearPassword 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      {editClearPassword ? 'Will Remove Password' : 'Remove Password'}
                    </button>
                  )}
                </div>

                {!editClearPassword && (
                  <input 
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={editingLink.password_hash ? '•••••••• (Enter new to override)' : 'Type a secure password...'}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4.5 py-2.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all mt-1"
                  />
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="px-4 py-2 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
              >
                {savingEdit ? (
                  <>
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setLinkToDelete(null);
          }}
          onConfirm={confirmRevoke}
          isDeleting={!!revokingId}
          title="Revoke Public Share Link"
          message="Are you absolutely sure you want to revoke this public share link? Anyone with this URL will immediately lose access."
          confirmText="Revoke Link"
        />
      )}
    </div>
  );
}

