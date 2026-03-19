'use client';

import { ExclamationTriangleIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Asset',
  message = 'Are you sure you want to delete this asset? This action cannot be undone.',
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-[#0f111a] rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800/60 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Warning Icon */}
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-red-50/50 dark:ring-red-500/5">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px]">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-10">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Delete permanently</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full py-3.5 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
