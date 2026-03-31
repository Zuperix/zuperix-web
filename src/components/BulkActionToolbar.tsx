'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  FolderArrowDownIcon, 
  RectangleGroupIcon,
  TrashIcon,
  ArchiveBoxIcon,
  CheckBadgeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import AddToVaultModal from './AddToVaultModal';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import BulkAddCategoryModal from '@/components/BulkAddCategoryModal';
import BulkAddCollectionModal from '@/components/BulkAddCollectionModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface BulkActionToolbarProps {
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

export default function BulkActionToolbar({ 
  selectedIds, 
  onClear,
  onSuccess 
}: BulkActionToolbarProps) {
  const { activeWorkspace } = useWorkspace();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkStatusChange = async (status: string) => {
    if (!activeWorkspace) return;
    try {
      setIsProcessing(true);
      await apiFetch(`/assets/bulk`, {
        method: 'PATCH',
        body: JSON.stringify({
          asset_ids: selectedIds,
          updates: { status }
        })
      });
      toast.success(`Successfully updated ${selectedIds.length} assets`);
      onSuccess();
    } catch (error) {
      toast.error('Failed to update assets');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!activeWorkspace) return;
    try {
      setIsProcessing(true);
      await apiFetch(`/assets/bulk/delete`, {
        method: 'POST',
        body: JSON.stringify({
          asset_ids: selectedIds
        })
      });
      toast.success(`Successfully deleted ${selectedIds.length} assets`);
      setIsDeleteModalOpen(false);
      onSuccess();
      onClear();
    } catch (error) {
      toast.error('Failed to delete assets');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gray-900/90 dark:bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex items-center gap-2">
          <div className="px-4 border-r border-white/10 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-blue-500/20">
              {selectedIds.length}
            </div>
            <span className="text-xs font-semibold text-white/90 whitespace-nowrap">
              Assets Selected
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              disabled={isProcessing}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 group"
              title="Add to Categories"
            >
              <FolderArrowDownIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline">Categories</span>
            </button>

            <button 
              onClick={() => setIsCollectionModalOpen(true)}
              disabled={isProcessing}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 group"
              title="Add to Collection"
            >
              <RectangleGroupIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline">Collection</span>
            </button>

            <button 
              onClick={() => setIsVaultModalOpen(true)}
              disabled={isProcessing}
              className="p-2.5 text-white/70 hover:text-blue-400 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 group"
              title="Add to Vault"
            >
              <ShieldCheckIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline text-blue-400">Vault</span>
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button 
              disabled={isProcessing}
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2.5 text-white/70 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all flex items-center gap-2 group"
              title="Delete Selected"
            >
              <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button 
            onClick={onClear}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Clear Selection"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isCategoryModalOpen && (
        <BulkAddCategoryModal 
          selectedIds={selectedIds}
          onClose={() => setIsCategoryModalOpen(false)}
          onSuccess={onSuccess}
        />
      )}

      {isCollectionModalOpen && (
        <BulkAddCollectionModal 
          selectedIds={selectedIds}
          onClose={() => setIsCollectionModalOpen(false)}
          onSuccess={onSuccess}
        />
      )}

      {isVaultModalOpen && (
        <AddToVaultModal 
          selectedIds={selectedIds}
          onClose={() => setIsVaultModalOpen(false)}
          onSuccess={() => {
            onSuccess();
            onClear();
          }}
        />
      )}

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        isDeleting={isProcessing}
        title="Delete Multiple Assets"
        message={`Are you sure you want to delete ${selectedIds.length} assets? This action cannot be undone.`}
      />
    </>
  );
}
