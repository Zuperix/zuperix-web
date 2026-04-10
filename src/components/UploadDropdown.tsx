'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon, LinkIcon, CloudArrowUpIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';

export default function UploadDropdown({
  workspaceId,
  onUploadClick,
  onGenerateLinkClick,
  onManageLinksClick,
  onUploadStatusClick
}: {
  workspaceId: string;
  onUploadClick: () => void;
  onGenerateLinkClick: () => void;
  onManageLinksClick: () => void;
  onUploadStatusClick: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <PermissionGate action={Action.Create} subject="Asset" workspaceId={workspaceId}>
        <div className="flex rounded-xl shadow-lg shadow-blue-600/20 divide-x divide-blue-500/30">
          <button
            onClick={() => {
              setIsOpen(false);
              onUploadClick();
            }}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-l-xl hover:bg-blue-500 transition-all active:scale-95 shrink-0"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Upload
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center px-2 py-2 bg-blue-600 text-white hover:bg-blue-500 transition-colors rounded-r-xl"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </PermissionGate>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-[#0f111a] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1.5">
            <PermissionGate action={Action.Create} subject="Asset" workspaceId={workspaceId}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onGenerateLinkClick();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
              >
                <LinkIcon className="h-4 w-4 text-blue-500" />
                <span>Generate Upload Link</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onManageLinksClick();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
              >
                <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
                <span>Manage Upload Links</span>
              </button>
            </PermissionGate>

            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

            <button
              onClick={() => {
                setIsOpen(false);
                onUploadStatusClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
            >
              <CloudArrowUpIcon className="h-4 w-4 text-gray-500" />
              <span>Upload Status</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
