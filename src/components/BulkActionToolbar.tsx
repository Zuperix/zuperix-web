'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  FolderArrowDownIcon, 
  FolderIcon,
  Square3Stack3DIcon,
  TrashIcon,
  ArchiveBoxIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import AddToVaultModal from './AddToVaultModal';
import { toast } from 'sonner';
import { apiFetch, apiDownload } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Action } from '@/types/auth';
import BulkAddCategoryModal from '@/components/BulkAddCategoryModal';
import BulkAddCollectionModal from '@/components/BulkAddCollectionModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface BulkActionToolbarProps {
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
  onRemoveFromVault?: () => void;
}

export default function BulkActionToolbar({ 
  selectedIds, 
  onClear,
  onSuccess,
  onRemoveFromVault
}: BulkActionToolbarProps) {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { can } = usePermissions();
  const canUpdateAsset = can(Action.Update, 'Asset', activeWorkspace?.id);
  const canDeleteAsset = can(Action.Delete, 'Asset', activeWorkspace?.id);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkDownload = async () => {
    if (!activeWorkspace) return;
    try {
      setIsProcessing(true);
      if (selectedIds.length > 50) {
        await apiFetch(`/assets/bulk/download`, {
          method: 'POST',
          body: JSON.stringify({
            asset_ids: selectedIds,
            email: user?.email
          })
        });
        toast.success(`We're preparing your ${selectedIds.length} assets. You'll receive an email with a download link shortly.`);
      } else {
        toast.loading('Preparing your download...', { id: 'download-progress' });
        const blob = await apiDownload(`/assets/bulk/download`, {
          method: 'POST',
          body: JSON.stringify({
            asset_ids: selectedIds
          })
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zuperix-assets-${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.dismiss('download-progress');
        toast.success('Download started');
      }
    } catch (error: any) {
      toast.dismiss('download-progress');
      toast.error(error.message || 'Failed to start download');
    } finally {
      setIsProcessing(false);
    }
  };

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
      <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[calc(100vw-1rem)] sm:max-w-none animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0b0c14] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 sm:p-2.5 flex items-center gap-1 sm:gap-3 overflow-x-auto custom-scrollbar no-scrollbar">
          <div className="px-3 sm:px-5 border-r border-white/5 flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-black text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]">
              {selectedIds.length}
            </div>
            <span className="text-[11px] sm:text-[13px] font-black text-white whitespace-nowrap tracking-tight">
              <span className="hidden sm:inline">Assets </span>Selected
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canUpdateAsset && (
              <>
                <button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  disabled={isProcessing}
                  className="p-2 sm:p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 group shrink-0"
                  title="Add to Categories"
                >
                  <FolderIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium hidden md:inline">Categories</span>
                </button>

                <button 
                  onClick={() => setIsCollectionModalOpen(true)}
                  disabled={isProcessing}
                  className="p-2 sm:p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 group shrink-0"
                  title="Add to Collection"
                >
                  <Square3Stack3DIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium hidden md:inline">Collection</span>
                </button>
              </>
            )}


            {canUpdateAsset && onRemoveFromVault && (
              <button 
                onClick={onRemoveFromVault}
                disabled={isProcessing}
                className="p-2 sm:p-2.5 text-white/70 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all flex items-center gap-2 group border-l border-white/10 ml-1 pl-2 sm:pl-3 shrink-0"
                title="Remove from current Vault"
              >
                <ShieldExclamationIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium hidden md:inline text-orange-400 font-bold uppercase tracking-tight">Remove from Vault</span>
              </button>
            )}

            <button 
              disabled={isProcessing}
              onClick={handleBulkDownload}
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center gap-2 sm:gap-3 group sm:ml-2 shrink-0"
              title="Download Selected"
            >
              <FolderArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white/70 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline text-[12px] font-bold text-white/90">Download</span>
            </button>
            
            {canDeleteAsset && (
              <>
                <div className="hidden sm:block w-px h-6 bg-white/5 mx-1 sm:mx-2 shrink-0" />

                <button 
                  disabled={isProcessing}
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 sm:p-3 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl sm:rounded-2xl transition-all flex items-center group shrink-0"
                  title="Delete Selected"
                >
                  <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
          </div>

          <div className="w-px h-5 sm:h-6 bg-white/5 mx-1 shrink-0" />

          <button 
            onClick={onClear}
            className="p-2 sm:p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all mr-1 shrink-0"
            title="Clear Selection"
          >
            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
