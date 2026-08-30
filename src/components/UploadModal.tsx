'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentIcon,
  FolderIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useCategories, Category } from '@/hooks/useCategories';
import { useVaults } from '@/hooks/useVaults';
import { useMetadataFields } from '@/hooks/useMetadataFields';
import { LockClosedIcon } from '@heroicons/react/20/solid';
import { MetadataFieldInput } from './metadata/MetadataFieldInput';
import { useUpload } from '@/context/UploadContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  MAX_FILES,
  fileIcon,
  formatSize,
} from '@/lib/uploadService';
import { toast } from 'sonner';

function InfoTooltip({ content }: { content: string }) {
  return (
    <span 
      className="relative group inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400 hover:text-blue-500 transition-colors cursor-help" />
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[70] scale-95 group-hover:scale-100 origin-bottom">
        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
          {content}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[4px] border-transparent border-t-gray-800" />
      </div>
    </span>
  );
}

function flattenCategories(
  cats: Category[],
  depth = 0
): { id: string; name: string; depth: number; metadata_template_id: string | null }[] {
  let result: { id: string; name: string; depth: number; metadata_template_id: string | null }[] = [];
  cats.forEach((cat) => {
    result.push({ id: cat.id, name: cat.name, depth, metadata_template_id: cat.metadata_template_id });
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children, depth + 1));
    }
  });
  return result;
}

export default function UploadModal(props: {
  workspaceId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
} = {}) {
  const { isModalOpen } = useUpload();
  if (!isModalOpen) return null;
  return <UploadModalContent {...props} />;
}

function UploadModalContent({
  workspaceId: propWorkspaceId,
  onClose: propOnClose,
  onSuccess: propOnSuccess,
}: {
  workspaceId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = propWorkspaceId || activeWorkspace?.id || '';

  const {
    entries,
    running,
    done,
    counts,
    overallProgress,
    addFiles,
    removeEntry,
    startUpload,
    retryFailed,
    forceAllDuplicates,
    closeModal,
    minimizeModal,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedVaultId,
    setSelectedVaultId,
    initialMetadata,
    setInitialMetadata,
    updateEntry,
  } = useUpload();

  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Category & Vault selection state
  const { categories } = useCategories();
  const { vaults } = useVaults();

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  // Set default selected category to the fetched "Global" category if available
  useEffect(() => {
    if (flatCategories.length > 0 && !selectedCategoryId) {
      const globalCat = flatCategories.find(c => c.name.toLowerCase() === 'global');
      if (globalCat) {
        setSelectedCategoryId(globalCat.id);
      } else {
        setSelectedCategoryId(flatCategories[0].id);
      }
    }
  }, [flatCategories, selectedCategoryId, setSelectedCategoryId]);

  // Metadata state
  const { fields: metadataFields } = useMetadataFields(workspaceId);
  const [showMetadata, setShowMetadata] = useState(false);
  const [activeTemplateFields, setActiveTemplateFields] = useState<string[] | null>(null);

  const currentCategory = useMemo(
    () => (selectedCategoryId ? flatCategories.find(c => c.id === selectedCategoryId) : null),
    [flatCategories, selectedCategoryId]
  );
  const metadataTemplateId = currentCategory?.metadata_template_id;

  useEffect(() => {
    if (!metadataTemplateId || !workspaceId) return;
    let isMounted = true;
    apiFetch<{ field_ids?: string[]; fieldIds?: string[] }>(
      `/workspaces/${workspaceId}/metadata/templates/${metadataTemplateId}`
    )
      .then(data => {
        if (!isMounted) return;
        setActiveTemplateFields(data.field_ids || data.fieldIds || []);
        setShowMetadata(true); // Auto expand required template fields
      })
      .catch(() => {
        if (!isMounted) return;
        setActiveTemplateFields(null);
      });
    return () => {
      isMounted = false;
    };
  }, [metadataTemplateId, workspaceId]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const items = e.dataTransfer.items;
    if (!items) {
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
      return;
    }

    const files: File[] = [];
    const traverseEntry = async (entry: FileSystemEntry, path = '') => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve) => fileEntry.file(resolve));
        if (path) {
          (file as File & { path?: string }).path = path + '/' + file.name;
        }
        files.push(file);
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          let allEntries: FileSystemEntry[] = [];
          const read = () => {
            reader.readEntries((results) => {
              if (results.length > 0) {
                allEntries = allEntries.concat(results);
                read();
              } else {
                resolve(allEntries);
              }
            });
          };
          read();
        });
        for (const child of entries) {
          await traverseEntry(child, path ? path + '/' + entry.name : entry.name);
        }
      }
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        promises.push(traverseEntry(entry));
      }
    }
    
    await Promise.all(promises);

    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleClose = () => {
    if (running) {
      minimizeModal();
      toast.info('Uploads continuing in background. Keep this browser tab open.');
    } else {
      closeModal();
      if (propOnClose) propOnClose();
    }
  };

  const handleUploadAll = async () => {
    await startUpload();
    if (propOnSuccess) propOnSuccess();
  };

  const visibleFields = activeTemplateFields
    ? metadataFields.filter(f => activeTemplateFields.includes(f.id))
    : [];

  const missingRequiredFields = visibleFields.filter(f => {
    if (!f.is_required) return false;
    const val = initialMetadata[f.key];
    return val === undefined || val === null || val === '';
  });

  const isMetadataValid = missingRequiredFields.length === 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold dark:text-white">Bulk Upload</h2>
              {running && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full animate-pulse">
                  Uploading ({overallProgress}%)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Up to {MAX_FILES} items · 5 GB each</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Minimize button */}
            <button 
              onClick={minimizeModal} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Minimize to background (continue uploading while browsing)"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
            {/* Close button */}
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title={running ? "Minimize to background" : "Close"}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category & Vault Selector */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20 border-b dark:border-gray-800 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Target Category
                <InfoTooltip content="Organize your assets into a specific category within the workspace." />
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    setSelectedCategoryId(newCatId);
                    const cat = flatCategories.find(c => c.id === newCatId);
                    if (!cat?.metadata_template_id) {
                      setActiveTemplateFields(null);
                    }
                  }}
                  disabled={running}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                >
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'\u00A0'.repeat(cat.depth * 3)}{cat.name}
                    </option>
                  ))}
                </select>
                <FolderIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Target Vault (Optional)
                <InfoTooltip content="Place these assets inside a confidential vault with restricted team permissions." />
              </label>
              <div className="relative">
                <select
                  value={selectedVaultId}
                  onChange={(e) => setSelectedVaultId(e.target.value)}
                  disabled={running}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                >
                  <option value="">No Vault (Workspace Open)</option>
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Metadata Drawer */}
          <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center justify-between w-full text-left group"
            >
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                  Initial Custom Metadata
                </span>
                {Object.keys(initialMetadata).length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">
                    {Object.keys(initialMetadata).length} applied
                  </span>
                )}
                {activeTemplateFields && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded text-[10px] font-bold">
                    Template Required
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <span>{showMetadata ? 'Hide' : 'Configure'}</span>
                {showMetadata ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
              </div>
            </button>

            {showMetadata && (
              <div className="mt-3 space-y-3 bg-white dark:bg-gray-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 max-h-48 overflow-y-auto custom-scrollbar">
                {activeTemplateFields && (
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-xl mb-3">
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                      Category template applied. Fields below are pre-selected for this upload.
                    </p>
                  </div>
                )}
                {metadataFields.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">No custom metadata fields defined in this workspace.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeTemplateFields 
                      ? metadataFields.filter(f => activeTemplateFields.includes(f.id))
                      : metadataFields
                    ).map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          {field.label}
                          {field.is_required && <span className="text-red-500">*</span>}
                        </label>
                        <MetadataFieldInput
                          field={field}
                          value={initialMetadata[field.key]}
                          onChange={(val) => setInitialMetadata(prev => ({ ...prev, [field.key]: val }))}
                          disabled={running}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {entries.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center transition-all ${
                dragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <CloudArrowUpIcon className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                Drop your files or folders here
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
                Images, videos, documents, or entire folder structures up to 5 GB each.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  Choose Files
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold rounded-xl transition-all active:scale-95"
                >
                  Choose Folder
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is standard for folder inputs
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b dark:border-gray-800 text-xs text-gray-500">
                <span>{counts.total} items queued</span>
                <div className="flex items-center gap-2">
                  {!running && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                      >
                        + Add More
                      </button>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <button
                        onClick={() => folderInputRef.current?.click()}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                      >
                        + Add Folder
                      </button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    // @ts-expect-error webkitdirectory is standard for folder inputs
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* Progress Summary Bar when running */}
              {running && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>Uploading in progress...</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                    You can minimize this modal or navigate anywhere in Zuperix. Uploads will continue in the background.
                  </p>
                </div>
              )}

              {/* List of files */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60 max-h-80 overflow-y-auto custom-scrollbar">
                {entries.map((entry) => {
                  const Icon = fileIcon(entry.file);
                  const isDuplicate = entry.status === 'duplicate';

                  return (
                    <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 flex-shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {entry.relativePath ? `${entry.relativePath}/${entry.file.name}` : entry.file.name}
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {formatSize(entry.file.size)}
                            </span>
                            {entry.error && (
                              <p className="text-[10px] text-rose-500 font-medium truncate mt-0.5">
                                {entry.error}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {entry.status === 'uploading' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                {entry.progress}%
                              </span>
                              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                  style={{ width: `${entry.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {entry.status === 'done' && (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                          )}
                          {entry.status === 'error' && (
                            <ExclamationCircleIcon className="h-5 w-5 text-rose-500" />
                          )}
                          {isDuplicate && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Duplicate
                            </span>
                          )}
                          {(entry.status === 'pending' || entry.status === 'error' || isDuplicate) && !running && (
                            <button
                              onClick={() => removeEntry(entry.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Duplicate preview box */}
                      {isDuplicate && entry.duplicateAsset && (
                        <div className="ml-9 mt-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/20 flex items-center gap-4 animate-in slide-in-from-top-1 duration-200">
                          <div className="h-14 w-14 bg-white dark:bg-gray-950 rounded-lg overflow-hidden border border-amber-200 dark:border-amber-800 shadow-inner flex-shrink-0">
                            {entry.file.type.startsWith('image/') ? (
                              <img 
                                src={entry.duplicateAsset.asset_live_url} 
                                className="h-full w-full object-cover" 
                                alt="Existing duplicate" 
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <DocumentIcon className="h-6 w-6 text-amber-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-0.5">Found Match in Library</p>
                            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium truncate mb-1">{entry.duplicateAsset.original_name}</p>
                            {!running && (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    updateEntry(entry.id, { force: true });
                                    setTimeout(() => startUpload(), 0);
                                  }}
                                  className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 underline uppercase tracking-widest"
                                >
                                  Skip and upload anyway
                                </button>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <a
                                  href={`/assets/${entry.duplicateAsset.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-500 hover:text-amber-700 underline uppercase tracking-widest"
                                >
                                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                  View in Library
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="text-xs text-gray-500">
            {counts.total === 0
              ? 'No files selected'
              : `${counts.pending + counts.uploading} active · ${counts.done} done · ${counts.duplicate} duplicate`}
          </div>
          <div className="flex items-center gap-3">
            {done && counts.error > 0 && (
              <button
                onClick={retryFailed}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-rose-600 border border-rose-300 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Retry Failed ({counts.error})
              </button>
            )}
            {done && counts.duplicate > 0 && (
              <button
                onClick={forceAllDuplicates}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-amber-600 border border-amber-300 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                Force Duplicates ({counts.duplicate})
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {running ? 'Minimize' : done ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleUploadAll}
              disabled={running || counts.pending === 0 || !isMetadataValid}
              className="group relative flex items-center gap-2 px-6 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
            >
              {running ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Upload {counts.pending > 0 ? `${counts.pending} file${counts.pending !== 1 ? 's' : ''}` : 'All'}
                </>
              )}
              {!isMetadataValid && counts.pending > 0 && !running && (
                <div className="absolute bottom-full mb-3 right-0 w-64 p-3 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] scale-95 group-hover:scale-100 origin-bottom-right">
                  <div className="flex items-start gap-2">
                    <ExclamationCircleIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Required Content Missing</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Please fill in the required metadata field{missingRequiredFields.length > 1 ? 's' : ''}: <span className="text-amber-400 font-bold">{missingRequiredFields.map(f => f.label).join(', ')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-full right-6 -mt-1 border-[6px] border-transparent border-t-gray-900" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
