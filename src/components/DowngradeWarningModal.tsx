'use client';

import { ExclamationTriangleIcon, XMarkIcon, ChevronDoubleDownIcon } from '@heroicons/react/24/outline';

interface DowngradeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetPlanName: string;
  isProcessing?: boolean;
}

export default function DowngradeWarningModal({
  isOpen,
  onClose,
  onConfirm,
  targetPlanName,
  isProcessing = false,
}: DowngradeWarningModalProps) {
  if (!isOpen) return null;

  const titleId = 'downgrade-warning-modal-title';
  const descriptionId = 'downgrade-warning-modal-description';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
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
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-amber-50/50 dark:ring-amber-500/5">
              <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            </div>

            <h3 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Downgrade to {targetPlanName}?
            </h3>
            <p id={descriptionId} className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed px-4">
              Switching to a lower tier may result in <span className="text-amber-500 font-bold">data loss</span> if your usage exceeds the new limits. Some features will also be disabled.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-10">
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-xs tracking-widest uppercase rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ChevronDoubleDownIcon className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                  <span>Confirm Downgrade</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-3.5 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs tracking-widest uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
