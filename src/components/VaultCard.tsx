'use client';

import React from 'react';
import { 
  ShieldCheckIcon, 
  TrashIcon, 
  PencilSquareIcon,
  CalendarIcon,
  ArrowRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';
import { Vault } from '@/hooks/useVaults';

interface VaultCardProps {
  vault: Vault;
  workspaceId?: string;
  onEdit: (vault: Vault) => void;
  onDelete: (id: string) => void;
}

export default function VaultCard({ vault, workspaceId, onEdit, onDelete }: VaultCardProps) {
  return (
    <div 
      className="group flex flex-col p-6 rounded-[32px] bg-gray-900/40 border border-gray-800/60 hover:border-blue-500/30 hover:bg-gray-800/40 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
         <PermissionGate action={Action.Update} subject="Vault" workspaceId={workspaceId}>
           <button 
             onClick={() => onEdit(vault)}
             className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
             title="Edit Vault"
           >
              <PencilSquareIcon className="h-4 w-4" />
           </button>
         </PermissionGate>
         <PermissionGate action={Action.Delete} subject="Vault" workspaceId={workspaceId}>
           <button 
             onClick={() => onDelete(vault.id)}
             className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
             title="Delete Vault"
           >
              <TrashIcon className="h-4 w-4" />
           </button>
         </PermissionGate>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{vault.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              Secure Vault
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-6 leading-relaxed">
        {vault.description || 'No description provided for this vault.'}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-gray-800/60 pt-4">
         <div className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-[10px] text-gray-500 font-mono">{new Date(vault.created_at).toLocaleDateString()}</span>
         </div>
         <Link 
           href={`/dashboard/vaults/${vault.id}`}
           className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all uppercase tracking-widest active:scale-95"
         >
            Open
            <ArrowRightIcon className="h-3 w-3" />
         </Link>
      </div>
    </div>
  );
}
