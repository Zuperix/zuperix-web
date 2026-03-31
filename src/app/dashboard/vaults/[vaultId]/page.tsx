'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVaultAssets } from '@/hooks/useVaultAssets';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  PhotoIcon, 
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import AssetGrid from '@/components/AssetGrid';
import VaultMembersSection, { VaultRole } from '@/components/VaultMembersSection';
import { useAuth } from '@/context/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import { toast } from 'sonner';

export default function VaultDetailPage() {
  const { vaultId } = useParams() as { vaultId: string };
  const router = useRouter();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { assets, loading: assetsLoading, removeAssetsFromVault, refresh: refreshAssets } = useVaultAssets(vaultId);
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'members'>('assets');

  useEffect(() => {
    const fetchVault = async () => {
      if (!activeWorkspace || !vaultId) return;
      try {
        setLoading(true);
        const data = await apiFetch<any>(`/workspaces/${activeWorkspace.id}/vaults/${vaultId}`);
        setVault(data);
      } catch (error) {
        console.error('Failed to fetch vault details');
        toast.error('Vault not found or access denied');
        router.push('/dashboard/vaults');
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, [activeWorkspace, vaultId]);

  const userRole = vault?.members?.find((m: any) => m.userId === user?.id)?.role;
  const isOwner = userRole === VaultRole.OWNER || user?.system_role === 'SUPER_ADMIN';
  const isEditor = isOwner || userRole === VaultRole.EDITOR;

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Remove this asset from the vault? This won\'t delete it from the workspace.')) return;
    try {
      await removeAssetsFromVault([assetId]);
      toast.success('Asset removed from vault');
    } catch (error) {
      toast.error('Failed to remove asset');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
        <ShieldCheckIcon className="h-12 w-12 text-blue-500/20 animate-pulse" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Unlocking Vault...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-6">
        <button 
          onClick={() => router.push('/dashboard/vaults')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-all"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Vaults
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
                {vault.name}
              </h1>
            </div>
            <p className="text-gray-500 text-sm max-w-2xl">{vault.description || 'Secure Asset Repository'}</p>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-2xl flex items-center gap-3">
                <div className="flex -space-x-2">
                   {vault.members?.slice(0, 3).map((m: any, i: number) => (
                     <div key={i} className="h-8 w-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {m.user?.name?.charAt(0) || '?'}
                     </div>
                   ))}
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{vault.members?.length} Members</span>
             </div>
             
             {isOwner && (
               <PermissionGate action={Action.Update} subject="Vault" workspaceId={activeWorkspace?.id}>
                  <button className="p-2.5 bg-gray-900/50 border border-gray-800 hover:border-blue-500/30 text-gray-500 hover:text-blue-400 rounded-2xl transition-all">
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
               </PermissionGate>
             )}
          </div>
        </div>
      </header>

      <div className="border-b border-gray-800 flex items-center gap-8">
        <button 
          onClick={() => setActiveTab('assets')}
          className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'assets' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-4 w-4" />
            Assets ({assets.length})
          </div>
          {activeTab === 'assets' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full animate-in slide-in-from-left-full duration-300" />}
        </button>

        <button 
          onClick={() => setActiveTab('members')}
          className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'members' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4" />
            Members
          </div>
          {activeTab === 'members' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full animate-in slide-in-from-left-full duration-300" />}
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'assets' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Vault Contents</h2>
               {isEditor && (
                 <button 
                   onClick={() => router.push('/dashboard')}
                   className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                 >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add Assets
                 </button>
               )}
            </div>
            
            {assetsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="aspect-square rounded-3xl bg-gray-900/20 animate-pulse border border-gray-800" />
                 ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="py-24 text-center bg-gray-900/20 rounded-[48px] border-2 border-dashed border-gray-800 space-y-4">
                 <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <LockClosedIcon className="h-8 w-8 text-gray-600" />
                 </div>
                 <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">This vault is currently empty</p>
              </div>
            ) : (
              <AssetGrid 
                assets={assets} 
                onDelete={handleDeleteAsset}
                onSelect={(id) => router.push(`/dashboard/assets/${id}`)}
                onSuccess={refreshAssets}
              />
            )}
          </div>
        ) : (
          <VaultMembersSection 
            vaultId={vaultId} 
            workspaceId={activeWorkspace!.id} 
            currentUserId={user!.id}
            isAdmin={user?.system_role === 'SUPER_ADMIN'}
          />
        )}
      </div>
    </div>
  );
}
