'use client';

import { useState } from 'react';
import { 
  CpuChipIcon, 
  ChevronLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useWorkspace } from '@/context/WorkspaceContext';
import DuplicateFinderModal from '@/components/DuplicateFinderModal';

export default function MaintenancePage() {
  const { activeWorkspace } = useWorkspace();
  const [isDuplicateFinderOpen, setIsDuplicateFinderOpen] = useState(false);

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-400 font-medium">Please select a workspace to manage maintenance tasks.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 animate-in fade-in duration-500">
      <div className="mb-10">
        <Link 
          href="/settings" 
          className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 transition-colors group"
        >
          <ChevronLeftIcon className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <CpuChipIcon className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Library Maintenance</h1>
        </div>
        <p className="text-gray-400 mt-2 text-sm">Keep your digital asset library organized and optimized with these tools.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="group p-8 bg-gray-900/40 border border-gray-800 rounded-3xl hover:bg-gray-800/60 hover:border-gray-700 transition-all duration-300 flex flex-col md:flex-row items-center gap-8">
          <div className="p-5 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <CpuChipIcon className="h-10 w-10 text-amber-400" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-200 group-hover:text-white transition-colors mb-2">
              Duplicate Scanner
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
              Find and remove identical or near-matching images in your workspace. This helps save storage space and ensures your library stays clean and organized.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Manual Review Advised
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsDuplicateFinderOpen(true)}
            className="px-8 py-3 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/20 active:scale-95 whitespace-nowrap"
          >
            Start Scanner
          </button>
        </div>
      </div>

      {isDuplicateFinderOpen && (
        <DuplicateFinderModal
          workspaceId={activeWorkspace.id}
          onClose={() => setIsDuplicateFinderOpen(false)}
          onRefresh={() => {}} // We don't need to refresh anything on this page
        />
      )}
    </div>
  );
}
