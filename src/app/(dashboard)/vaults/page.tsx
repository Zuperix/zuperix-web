'use client';

import React, { useState } from 'react';
import { useVaults, Vault } from '@/hooks/useVaults';
import { 
  PlusIcon, 
  LockClosedIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import { useWorkspace } from '@/context/WorkspaceContext';
import VaultCard from '@/components/VaultCard';
import DeleteVaultModal from '@/components/DeleteVaultModal';
import DocumentationLink from '@/components/DocumentationLink';

export default function VaultsPage() {
  const { vaults, createVault, updateVault, deleteVault, loading } = useVaults();
  const { activeWorkspace } = useWorkspace();
  const [isAdding, setIsAdding] = useState(false);
  const [editingVault, setEditingVault] = useState<Vault | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createVault(name, description);
      setName('');
      setDescription('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create vault');
    }
  };

  const handleUpdate = async () => {
    if (!editingVault || !name.trim()) return;
    try {
      await updateVault(editingVault.id, name, description);
      setEditingVault(null);
      setName('');
      setDescription('');
    } catch (err) {
      console.error('Failed to update vault');
    }
  };

  const startEdit = (vault: Vault) => {
    setEditingVault(vault);
    setName(vault.name);
    setDescription(vault.description || '');
  };

  const handleDeleteConfirm = async () => {
    if (!vaultToDelete) return;
    try {
      await deleteVault(vaultToDelete.id);
      setVaultToDelete(null);
    } catch (err) {
      console.error('Failed to delete vault');
    }
  };

  const filteredVaults = vaults.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <LockClosedIcon className="h-9 w-9 text-blue-500" />
            Vaults
          </h1>
          <p className="text-gray-500 text-sm mt-1 mx-1">Securely group assets and manage member-level access controls.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search vaults..."
              className="bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <PermissionGate action={Action.Create} subject="Vault" workspaceId={activeWorkspace?.id}>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
              New Vault
            </button>
          </PermissionGate>
        </div>
      </header>

      {(isAdding || editingVault) && (
        <div className="bg-gray-900/60 p-8 border border-blue-500/30 rounded-[32px] animate-in zoom-in-95 duration-200 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-bold text-white uppercase tracking-widest">
               {editingVault ? `Edit Vault: ${editingVault.name}` : 'Create New Vault'}
             </h3>
             <button 
               onClick={() => { setIsAdding(false); setEditingVault(null); }} 
               className="text-gray-500 hover:text-white transition-colors"
             >
                <XMarkIcon className="h-5 w-5" />
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Marketing Assets, Q2 Product Launch, etc."
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (editingVault ? handleUpdate() : handleCreate())}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Description (Optional)</label>
                <input 
                  type="text"
                  placeholder="What kind of assets are in this vault?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (editingVault ? handleUpdate() : handleCreate())}
                />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800/60">
            <button 
              onClick={() => { setIsAdding(false); setEditingVault(null); }}
              className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={editingVault ? handleUpdate : handleCreate}
              className="px-10 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40"
            >
              {editingVault ? 'Save Changes' : 'Create Vault'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && filteredVaults.length === 0 ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-900/20 border border-gray-800/60 rounded-[32px] animate-pulse" />
          ))
        ) : filteredVaults.length === 0 ? (
          <div className="col-span-full text-center py-32 bg-gray-900/20 rounded-[48px] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-6">
             <div className="h-20 w-20 rounded-full bg-gray-800/50 flex items-center justify-center">
                <LockClosedIcon className="h-10 w-10 text-gray-700" />
             </div>
             <div className="space-y-1">
                 <p className="text-white font-bold text-lg">No vaults found</p>
                 <p className="text-gray-500 text-sm">Organize your assets into secure groups with member access.</p>
             </div>
             <PermissionGate action={Action.Create} subject="Vault" workspaceId={activeWorkspace?.id}>
               <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-4 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
               >
                  Create Your First Vault
               </button>
             </PermissionGate>
          </div>
        ) : (
          filteredVaults.map(vault => (
            <VaultCard 
              key={vault.id} 
              vault={vault} 
              workspaceId={activeWorkspace?.id} 
              onEdit={startEdit} 
              onDelete={() => setVaultToDelete(vault)} 
            />
          ))
        )}
      </div>
      <DeleteVaultModal 
        isOpen={!!vaultToDelete}
        onClose={() => setVaultToDelete(null)}
        onConfirm={handleDeleteConfirm}
        vaultName={vaultToDelete?.name || ''}
      />
      <DocumentationLink href="https://docs.zuperix.com/docs/assets/vaults" />
    </div>
  );
}
