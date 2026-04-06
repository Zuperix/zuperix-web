'use client';

import React from 'react';
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  BellIcon, 
  SunIcon, 
  CloudArrowUpIcon,
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const SkeletonAssetCard = ({ index }: { index: number }) => (
  <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden flex flex-col h-64 grayscale opacity-40">
    <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800/30 flex items-center justify-center">
      {index % 3 === 0 ? (
        <PhotoIcon className="h-8 w-8 text-gray-300 dark:text-gray-700" />
      ) : index % 3 === 1 ? (
        <VideoCameraIcon className="h-8 w-8 text-gray-300 dark:text-gray-700" />
      ) : (
        <DocumentIcon className="h-8 w-8 text-gray-300 dark:text-gray-700" />
      )}
    </div>
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded-full w-2/3" />
      <div className="flex justify-between items-center">
        <div className="h-2 bg-gray-50 dark:bg-gray-800/30 rounded-full w-1/4" />
        <div className="h-2 bg-gray-50 dark:bg-gray-800/30 rounded-full w-1/5" />
      </div>
    </div>
  </div>
);

export default function OnboardingBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Mock Dashboard Layout */}
      <div className="flex h-screen bg-gray-50 dark:bg-[#0f111a]">
        {/* Mock Sidebar */}
        <div className="w-64 border-r border-gray-200/50 dark:border-gray-800/40 px-4 py-6 space-y-8 hidden md:block">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 bg-blue-600 rounded-xl" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-24" />
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 px-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded-full w-20" />
              </div>
            ))}
          </div>

          <div className="pt-10">
            <div className="px-2 mb-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full w-12" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <FolderIcon className="h-4 w-4 text-gray-200 dark:text-gray-800" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded-full w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mock Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Mock Header */}
          <div className="h-16 border-b border-gray-200/50 dark:border-gray-800/40 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Bars3Icon className="h-5 w-5 text-gray-300 dark:text-gray-700" />
              <div className="h-8 w-96 bg-gray-100 dark:bg-gray-900/50 rounded-2xl" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-100 dark:bg-gray-900/50 rounded-xl" />
              <div className="h-8 w-8 bg-gray-100 dark:bg-gray-900/50 rounded-xl" />
              <div className="h-8 w-24 bg-gray-100 dark:bg-gray-900/50 rounded-xl" />
            </div>
          </div>

          {/* Mock Asset Grid */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-32" />
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-gray-100 dark:bg-gray-900/50 rounded-xl" />
                <div className="h-10 w-10 bg-gray-100 dark:bg-gray-900/50 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(12)].map((_, i) => (
                <SkeletonAssetCard key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for blurring */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-[12px] transition-all duration-700" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5" />
    </div>
  );
}
