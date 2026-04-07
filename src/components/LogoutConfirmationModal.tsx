'use client';

import { ArrowRightOnRectangleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut?: boolean;
}

export default function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut = false,
}: LogoutConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirmation-modal-title"
        aria-describedby="logout-confirmation-modal-description"
        className="bg-white dark:bg-[#0f111a] rounded-3xl w-full max-w-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-2xl border border-gray-200 dark:border-gray-800/60 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-orange-50/50 dark:ring-orange-500/5">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            </div>

            <h3 id="logout-confirmation-modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Sign out?
            </h3>
            <p id="logout-confirmation-modal-description" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px]">
              You will be signed out of your account and will need to log in again to continue.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-10">
            <button
              onClick={onConfirm}
              disabled={isLoggingOut}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Logout</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isLoggingOut}
              className="w-full py-3.5 bg-gray-100/80 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 border border-gray-200 dark:border-transparent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
