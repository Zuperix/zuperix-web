'use client';

import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface RemoveAssetFromVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assetName?: string;
  count?: number;
}

export default function RemoveAssetFromVaultModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  assetName,
  count
}: RemoveAssetFromVaultModalProps) {
  if (!isOpen) return null;

  const isBulk = count && count > 1;

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
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              {isBulk ? `Remove ${count} Assets` : 'Remove Asset from Vault'}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              {isBulk ? (
                <>Are you sure you want to remove <span className="text-white font-bold">{count} assets</span> from this vault?</>
              ) : (
                <>Are you sure you want to remove <span className="text-white font-bold">{assetName ? `"${assetName}"` : "this asset"}</span> from the vault?</>
              )}
              {" "}This action will remain safe in your workspace, but they will no longer be accessible via this specific vault.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-900/20 active:scale-95 transition-all"
            >
              {isBulk ? `Remove ${count} Assets` : 'Remove Asset'}
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
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      </div>
    </div>
  );
}
