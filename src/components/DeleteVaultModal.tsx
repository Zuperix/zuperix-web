'use client';

import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface DeleteVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vaultName: string;
}

export default function DeleteVaultModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  vaultName 
}: DeleteVaultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Delete Vault</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              Are you sure you want to delete <span className="text-white font-bold">"{vaultName}"</span>? 
              ALL assets will remain safe in the workspace, but vault-specific access will be reset.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all"
            >
              Delete Vault Forever
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {/* Bottom Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
      </div>
    </div>
  );
}
