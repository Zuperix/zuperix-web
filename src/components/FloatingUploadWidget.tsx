'use client';

import React, { useState } from 'react';
import { useUpload } from '@/context/UploadContext';
import { formatSize, fileIcon } from '@/lib/uploadService';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function FloatingUploadWidget() {
  const {
    entries,
    running,
    done,
    isModalOpen,
    counts,
    overallProgress,
    openModal,
    dismissWidget,
    retryFailed,
    forceAllDuplicates,
  } = useUpload();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show when there are entries and the full modal is closed
  if (entries.length === 0 || isModalOpen) {
    return null;
  }

  const hasErrors = counts.error > 0;
  const hasDuplicates = counts.duplicate > 0;

  return (
    <aside
      aria-label="Upload Progress"
      className="fixed bottom-5 right-5 z-[80] w-[340px] sm:w-[400px] bg-white/95 dark:bg-[#12141c]/95 backdrop-blur-2xl border border-gray-200 dark:border-gray-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in"
    >
      {/* Header bar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
            running
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : done && !hasErrors
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
          }`}>
            {running ? (
              <CloudArrowUpIcon className="h-5 w-5 animate-pulse" />
            ) : done && !hasErrors ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
              {running
                ? `Uploading (${counts.done + counts.duplicate}/${counts.total})`
                : done && !hasErrors
                ? `Uploaded ${counts.total} item${counts.total > 1 ? 's' : ''}`
                : hasErrors
                ? `Completed with ${counts.error} error${counts.error > 1 ? 's' : ''}`
                : `Uploads (${counts.total})`}
            </h4>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {running ? `${overallProgress}% completed` : done ? 'All transfers finished' : 'In queue'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Re-open full modal */}
          <button
            onClick={() => openModal()}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Expand to Full Modal"
            aria-label="Expand to Full Modal"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>

          {/* Toggle details accordion */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isExpanded ? 'Hide item list' : 'Show item list'}
            aria-label={isExpanded ? 'Hide item list' : 'Show item list'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </button>

          {/* Close/Dismiss */}
          <button
            onClick={dismissWidget}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={running ? 'Cancel Uploads' : 'Dismiss'}
            aria-label={running ? 'Cancel Uploads' : 'Dismiss'}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main progress bar */}
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
          <span>Overall Progress</span>
          <span className="font-bold text-gray-900 dark:text-white">{overallProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              running
                ? 'bg-blue-600 dark:bg-blue-500'
                : done && !hasErrors
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Helpful background reminder banner while running */}
      {running && (
        <div className="mx-4 mb-3 px-3 py-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-2">
          <InformationCircleIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight font-medium">
            Uploads continue in background as you browse. Keep this browser tab open.
          </p>
        </div>
      )}

      {/* Action bar for failures or duplicates */}
      {(hasErrors || hasDuplicates) && !running && (
        <div className="px-4 pb-3 flex items-center gap-2">
          {hasErrors && (
            <button
              onClick={retryFailed}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 rounded-xl text-[10px] font-bold transition-all"
            >
              <ArrowPathIcon className="h-3 w-3" />
              Retry Failed ({counts.error})
            </button>
          )}
          {hasDuplicates && (
            <button
              onClick={forceAllDuplicates}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 rounded-xl text-[10px] font-bold transition-all"
            >
              <DocumentDuplicateIcon className="h-3 w-3" />
              Force Duplicates ({counts.duplicate})
            </button>
          )}
        </div>
      )}

      {/* Expanded item details */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800/60 max-h-56 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800/40">
          {entries.map((entry) => {
            const Icon = fileIcon(entry.file);
            return (
              <div key={entry.id} className="p-2.5 px-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gray-900 dark:text-gray-200 truncate">
                      {entry.file.name}
                    </p>
                    <span className="text-[9px] text-gray-400">
                      {formatSize(entry.file.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.status === 'uploading' && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {entry.progress}%
                    </span>
                  )}
                  {entry.status === 'done' && (
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  )}
                  {entry.status === 'error' && (
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                      Failed
                    </span>
                  )}
                  {entry.status === 'duplicate' && (
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                      Duplicate
                    </span>
                  )}
                  {entry.status === 'pending' && (
                    <span className="text-[9px] font-medium text-gray-400">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
