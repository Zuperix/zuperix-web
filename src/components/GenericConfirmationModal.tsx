'use client';

import { ExclamationTriangleIcon, XMarkIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ConfirmationVariant = 'danger' | 'warning' | 'primary' | 'success';

interface GenericConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: ConfirmationVariant;
}

export default function GenericConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'primary',
}: GenericConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />,
      iconBg: 'bg-red-50 dark:bg-red-500/10',
      iconRing: 'ring-red-50/50 dark:ring-red-500/5',
      button: 'bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-red-500/20',
      buttonText: 'text-white'
    },
    warning: {
      icon: <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />,
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconRing: 'ring-amber-50/50 dark:ring-amber-500/5',
      button: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/20',
      buttonText: 'text-white'
    },
    primary: {
      icon: <InformationCircleIcon className="h-8 w-8 text-blue-500" />,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconRing: 'ring-blue-50/50 dark:ring-blue-500/5',
      button: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20',
      buttonText: 'text-white'
    },
    success: {
      icon: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
      iconBg: 'bg-green-50 dark:bg-green-500/10',
      iconRing: 'ring-green-50/50 dark:ring-green-500/5',
      button: 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-green-500/20',
      buttonText: 'text-white'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-[#0f111a] rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800/60 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center mb-6 ring-8 ${styles.iconRing}`}>
              {styles.icon}
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
              disabled={isLoading}
              className={`w-full py-3.5 ${styles.button} ${styles.buttonText} font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
