'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  LockClosedIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

interface AddToVaultModalProps {
  selectedIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddToVaultModal({ 
  selectedIds, 
  onClose, 
  onSuccess 
}: AddToVaultModalProps) {
  const { activeWorkspace } = useWorkspace();
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchVaults = async () => {
      if (!activeWorkspace) return;
      try {
        const data = await apiFetch<any[]>(`/workspaces/${activeWorkspace.id}/vaults`);
        setVaults(data);
      } catch (error) {
        toast.error('Failed to load vaults');
      } finally {
        setLoading(false);
      }
    };
    fetchVaults();
  }, [activeWorkspace]);

  const handleSubmit = async () => {
    if (!selectedVaultId || !activeWorkspace) return;
    try {
      setIsSubmitting(true);
      await apiFetch(`/workspaces/${activeWorkspace.id}/vaults/${selectedVaultId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: selectedIds })
      });
      toast.success(`Added ${selectedIds.length} assets to vault`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add assets to vault');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVaults = vaults.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-950 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800/60 animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <LockClosedIcon className="h-6 w-6 text-blue-500" />
              Add to Vault
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Protect {selectedIds.length} assets with secure access</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors group">
            <XMarkIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search vaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredVaults.map((vault) => (
                  <button
                    key={vault.id}
                    onClick={() => setSelectedVaultId(vault.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      selectedVaultId === vault.id 
                        ? 'bg-blue-600 shadow-xl shadow-blue-900/20 text-white scale-[1.02]' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedVaultId === vault.id ? 'bg-white/20' : 'bg-blue-500/10 dark:bg-blue-500/20'}`}>
                        <LockClosedIcon className={`h-5 w-5 ${selectedVaultId === vault.id ? 'text-white' : 'text-blue-500'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-bold uppercase tracking-tight">{vault.name}</p>
                        <p className={`text-[10px] uppercase font-bold tracking-widest ${selectedVaultId === vault.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {vault.description || 'Secure Repository'}
                        </p>
                      </div>
                    </div>
                    {selectedVaultId === vault.id && (
                      <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                    )}
                  </button>
                ))}
                {filteredVaults.length === 0 && (
                  <div className="text-center py-12 px-4 rounded-3xl bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center gap-3">
                    <LockClosedIcon className="h-8 w-8 text-gray-300" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No vaults found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800/60 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedVaultId || isSubmitting}
            className="flex-[2] px-8 py-3.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/30 active:scale-95"
          >
            {isSubmitting ? 'Transferring...' : `Add to Vault`}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
