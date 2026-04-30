'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import AssetGrid from '@/components/AssetGrid';
import MetadataPanel from '@/components/MetadataPanel';
import {
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { toast } from 'sonner';

/**
 * Trash Management Page
 * Relocated to Settings dashboard. Items stay here for plan-specific days (7 or 30).
 */
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import EmptyTrashModal from '@/components/EmptyTrashModal';

export default function TrashSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const plan = user?.customer?.plan?.toLowerCase() || 'free';
  const retentionDays = ['gold', 'silver'].includes(plan) ? 30 : 7;
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    assetId: string | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    assetId: null,
    isDeleting: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrash = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        ...(searchQuery && { q: searchQuery }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        page: page.toString(),
        limit: limit.toString(),
      });
      const data = await apiFetch<any>(`/assets/trash?${params.toString()}`);
      setAssets(data.assets || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch trash:', err);
      toast.error('Failed to load trash items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiFetch(`/assets/${id}/restore`, { method: 'POST' });
      toast.success('Asset restored successfully');
      fetchTrash();
    } catch (err) {
      toast.error('Failed to restore asset');
    }
  };

  const handlePermanentDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      assetId: id,
      isDeleting: false,
    });
  };

  const confirmPermanentDelete = async () => {
    if (!confirmModal.assetId) return;
    setConfirmModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await apiFetch(`/assets/${confirmModal.assetId}/purge`, { method: 'DELETE' });
      toast.success('Asset permanently removed');
      fetchTrash();
    } catch (err) {
      toast.error('Failed to purge asset');
    } finally {
      setConfirmModal({ isOpen: false, assetId: null, isDeleting: false });
    }
  };

  const handleEmptyTrash = async () => {
    if (!activeWorkspace) return;

    try {
      setLoading(true);
      await apiFetch(`/assets/trash/empty?workspace_id=${activeWorkspace.id}`, { method: 'POST' });
      toast.success('Trash queued for deletion, you will be notified when it is deleted');
      fetchTrash();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to empty trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrash();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeWorkspace, searchQuery, startDate, endDate, page, limit]);

  if (!activeWorkspace) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="p-2 bg-red-500/10 rounded-xl">
            <TrashIcon className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trash Management</h1>
            <p className="text-sm text-gray-500">Items stay here for {retentionDays} days before being permanently removed.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all font-mono tracking-tighter"
            onClick={() => setIsModalOpen(true)}
          >
            <TrashIcon className="h-4 w-4" />
            EMPTY TRASH
          </button>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none px-3 py-2 bg-gray-900 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-800 focus:ring-2 focus:ring-red-500/20 outline-none cursor-pointer transition-all font-mono tracking-tighter"
            >
              {[20, 50, 100].map(size => (
                <option key={size} value={size}>{size} PER PAGE</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchTrash}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-bold text-gray-300 hover:bg-gray-800 transition-all font-mono tracking-tighter"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-3xl mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">DELETED FROM</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-950/50 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all dark:[color-scheme:dark]"
          />
          <span className="text-xs font-mono text-gray-500">TO</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-950/50 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all dark:[color-scheme:dark]"
          />
        </div>
        <button
          onClick={() => {
            setSearchQuery('');
            setStartDate('');
            setEndDate('');
          }}
          className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4"
        >
          CLEAR ALL
        </button>
      </div>

      <div className="bg-gray-950/40 border border-gray-800/60 rounded-3xl min-h-[500px] flex flex-col backdrop-blur-xl relative overflow-hidden">
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />

        {loading && assets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="h-10 w-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-2xl">
                <CheckCircleIcon className="h-12 w-12 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Trash is completely empty</h3>
            <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
              Nice work! Your workspace is organized and clutter-free.
            </p>
          </div>
        ) : (
          <div className="p-8 relative z-10">
            <AssetGrid
              assets={assets}
              onDelete={handlePermanentDelete}
              onRestore={handleRestore}
              onSelect={(id) => setSelectedAssetId(id === selectedAssetId ? null : id)}
              selectedIds={selectedAssetId ? [selectedAssetId] : []}
            />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {selectedAssetId && (
        <MetadataPanel
          assetId={selectedAssetId}
          workspaceId={activeWorkspace.id}
          onClose={() => setSelectedAssetId(null)}
        />
      )}

      <DeleteConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, assetId: null, isDeleting: false })}
        onConfirm={confirmPermanentDelete}
        isDeleting={confirmModal.isDeleting}
        title="Permanently Remove Asset"
        message="This item will be permanently removed. This action cannot be undone. Are you sure?"
        confirmText="Remove permanently"
      />

      <EmptyTrashModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleEmptyTrash}
        isPurging={loading}
      />
    </div>
  );
}
