"use client";

import React from "react";
import { XMarkIcon, SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import CustomImage from "./CustomImage";
import FileTypeIcon from "./FileTypeIcon";

type SearchAsset = {
  id: string;
  original_name?: string;
  mime_type?: string;
  thumbnail_lg_url?: string;
  asset_live_url?: string;
  score?: number;
  size?: number;
};

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedImageUrl: string | null;
  results: SearchAsset[];
  onNavigateToAsset: (assetId: string) => void;
}

export default function VisualSearchModal({
  isOpen,
  onClose,
  uploadedImageUrl,
  results,
  onNavigateToAsset,
}: VisualSearchModalProps) {
  if (!isOpen) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "0 Bytes";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const getMatchPercentage = (score: number) => {
    if (score === 10.0 || score === 1.0) return { percent: 100, label: "Exact Match", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (score === 5.0) return { percent: 98, label: "Near Match", color: "text-teal-500 bg-teal-500/10 border-teal-500/30" };
    
    // Convert decimal scores (0.60 to 0.98) into percentages
    const percent = Math.min(100, Math.max(60, Math.round(score * 100)));
    
    if (percent >= 85) {
      return { percent, label: "Near Match", color: "text-teal-500 bg-teal-500/10 border-teal-500/30" };
    }
    return { percent, label: "Visually Similar", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Uploaded Search Image */}
        <div className="md:w-1/3 bg-gray-50 dark:bg-gray-900/30 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center justify-center relative shrink-0">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Search Query</span>
          </div>

          <div className="w-full aspect-square max-w-[200px] relative rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center mt-6 md:mt-0">
            {uploadedImageUrl ? (
              <img 
                src={uploadedImageUrl} 
                alt="Search query" 
                className="object-contain w-full h-full p-2"
              />
            ) : (
              <div className="text-gray-400 text-xs">No image uploaded</div>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-4 text-center">
            Uploaded visual template
          </span>
        </div>

        {/* Right Side: Matching Results */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Visual Search Results
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  ({results.length} found)
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Showing highly relevant assets sorted by visual similarity percentage
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-[250px]">
            {results.length > 0 ? (
              results.map((asset) => {
                const match = getMatchPercentage(asset.score ?? 0);
                return (
                  <button
                    key={asset.id}
                    onClick={() => onNavigateToAsset(asset.id)}
                    className="w-full text-left p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 hover:border-blue-500/20 hover:bg-blue-50/20 dark:hover:bg-blue-900/5 flex items-center gap-4 transition-all group shadow-sm hover:shadow-md"
                  >
                    {/* Thumbnail */}
                    <div className="h-16 w-16 rounded-xl bg-gray-50 dark:bg-gray-900/50 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-800 group-hover:border-blue-500/30 transition-all shadow-inner relative">
                      {asset.mime_type?.startsWith("image/") ? (
                        <div className="relative h-full w-full">
                          <CustomImage
                            src={asset.thumbnail_lg_url || asset.asset_live_url || "/logo_transparant.png"}
                            alt=""
                            fill
                            shimmerWidth={64}
                            shimmerHeight={64}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full transform scale-75">
                          <FileTypeIcon mimeType={asset.mime_type || ''} filename={asset.original_name || ''} />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {asset.original_name}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1">
                        {(asset.mime_type || "file").split("/")[1]} • {formatSize(asset.size)}
                      </span>
                    </div>

                    {/* Match Score & Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl border ${match.color} text-right`}>
                        <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 leading-none opacity-80">
                          {match.label}
                        </span>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3 animate-pulse"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                  No highly relevant assets found
                </span>
                <p className="text-xs text-gray-400 dark:text-gray-600 max-w-sm mt-1">
                  Try search template images with stronger colors or clear subjects.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
