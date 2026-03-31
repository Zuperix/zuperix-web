'use client';

import { useState, useRef, useCallback, DragEvent } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  CubeTransparentIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { BASE_URL } from '@/lib/api';
import { useCategories, Category } from '@/hooks/useCategories';
import { useVaults } from '@/hooks/useVaults';
import { useMetadataFields, MetadataField } from '@/hooks/useMetadataFields';
import { LockClosedIcon } from '@heroicons/react/20/solid';

const CONCURRENCY = 5;
const MAX_FILES = 500;
const MAX_FILE_SIZE_MB = 500;

type FileStatus = 'pending' | 'uploading' | 'done' | 'error' | 'duplicate';

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  force?: boolean;
  duplicateAsset?: {
    id: string;
    original_name: string;
  };
}

function fileIcon(file: File) {
  if (file.type.startsWith('image/')) return PhotoIcon;
  if (file.type.startsWith('video/')) return VideoCameraIcon;
  if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) return CubeTransparentIcon;
  return DocumentIcon;
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <div className="relative group inline-block">
      <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400 hover:text-blue-500 transition-colors cursor-help" />
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[70] scale-95 group-hover:scale-100 origin-bottom">
        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
          {content}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[4px] border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

function uploadFileXHR(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, any> = {}
): Promise<void | { id: string; original_name: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', workspaceId);
    
    if (categoryIds.length > 0) {
      categoryIds.forEach(id => formData.append('category_ids[]', id));
    }

    if (vaultId) {
      formData.append('vault_id', vaultId);
    }

    if (Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status === 409) {
            reject(new DuplicateError(body.message || 'Duplicate detected', body.existing_asset));
            return;
          }
          msg = body.message || msg;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));
    xhr.timeout = 120_000;

    xhr.open('POST', `${BASE_URL}/assets/upload?workspace_id=${workspaceId}${force ? '&force=true' : ''}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

class DuplicateError extends Error {
  public asset?: { id: string; original_name: string };
  constructor(message: string, asset?: any) {
    super(message);
    this.name = 'DuplicateError';
    if (asset) {
      this.asset = {
        id: asset.id,
        original_name: asset.originalName || asset.original_name,
      };
    }
  }
}

export default function UploadModal({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // Category & Vault selection state
  const { categories } = useCategories();
  const { vaults } = useVaults();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');

  // Metadata state
  const { fields: metadataFields } = useMetadataFields(workspaceId);
  const [initialMetadata, setInitialMetadata] = useState<Record<string, any>>({});
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataSearch, setMetadataSearch] = useState('');

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_FILES - entries.length);
    const valid = arr.filter((f) => {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
    const newEntries: FileEntry[] = valid.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  }, [entries.length]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const updateEntry = (id: string, patch: Partial<FileEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const uploadAll = async () => {
    const token = localStorage.getItem('auth_token');
    abortRef.current = false;
    setRunning(true);
    setDone(false);

    const pending = entries.filter((e) => e.status === 'pending' || e.status === 'error' || (e.status === 'duplicate' && e.force));
    let i = 0;

    const categoryIds = selectedCategoryId ? [selectedCategoryId] : [];

    const next = async (): Promise<void> => {
      if (abortRef.current) return;
      const entry = pending[i++];
      if (!entry) return;

      updateEntry(entry.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        await uploadFileXHR(entry.file, workspaceId, token, (pct) => {
          updateEntry(entry.id, { progress: pct });
        }, categoryIds, selectedVaultId || null, entry.force, initialMetadata);
        updateEntry(entry.id, { status: 'done', progress: 100 });
      } catch (err: any) {
        if (err instanceof DuplicateError) {
          updateEntry(entry.id, { 
            status: 'duplicate', 
            progress: 0, 
            error: err.message,
            duplicateAsset: err.asset
          });
        } else {
          updateEntry(entry.id, { status: 'error', progress: 0, error: err.message });
        }
      }

      return next();
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => next());
    await Promise.all(workers);

    setRunning(false);
    setDone(true);
    onSuccess();
  };

  const retryFailed = () => {
    setEntries((prev) =>
      prev.map((e) => (e.status === 'error' ? { ...e, status: 'pending', progress: 0, error: undefined } : e)),
    );
    setDone(false);
  };

  const forceAllDuplicates = () => {
    setEntries((prev) =>
      prev.map((e) => (e.status === 'duplicate' ? { ...e, force: true } : e)),
    );
    // After marking them, we need to trigger uploadAll
    setTimeout(() => uploadAll(), 0);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const counts = {
    total: entries.length,
    done: entries.filter((e) => e.status === 'done').length,
    duplicate: entries.filter((e) => e.status === 'duplicate').length,
    error: entries.filter((e) => e.status === 'error').length,
    uploading: entries.filter((e) => e.status === 'uploading').length,
    pending: entries.filter((e) => e.status === 'pending').length,
  };

  const overallProgress =
    counts.total === 0
      ? 0
      : Math.round(
          entries.reduce((acc, e) => acc + (e.status === 'done' || e.status === 'duplicate' ? 100 : e.progress), 0) /
            counts.total,
        );

  // Helper to flatten categories for the select dropdown
  const flattenCategories = (cats: Category[], depth = 0): { id: string, name: string, depth: number }[] => {
    let result: { id: string, name: string, depth: number }[] = [];
    cats.forEach(cat => {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, depth + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Bulk Upload</h2>
            <p className="text-xs text-gray-500 mt-0.5">Up to {MAX_FILES} files · {MAX_FILE_SIZE_MB} MB each</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Category Selector */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20 border-b dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Target Category
                <InfoTooltip content="Organize your assets into a specific category within the workspace." />
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={running}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                >
                  <option value="">Default (Global Workspace)</option>
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

            {vaults.length > 0 && (
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  Target Vault
                  <InfoTooltip content="Vaults provide an extra layer of security with role-based access for sensitive assets." />
                </label>
                <div className="relative">
                  <select
                    value={selectedVaultId}
                    onChange={(e) => setSelectedVaultId(e.target.value)}
                    disabled={running}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="">No Vault (Direct Upload)</option>
                    {vaults.map((vault) => (
                      <option key={vault.id} value={vault.id}>
                        {vault.name}
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
            )}
          </div>
        </div>

        {/* Metadata Toggle & Fields */}
        {metadataFields.length > 0 && (
          <div className="flex-shrink-0 border-b dark:border-gray-800">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TagIcon className={`h-4 w-4 ${showMetadata ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Initial Metadata (Apply to all)
                  <InfoTooltip content="Common metadata values that will be automatically applied to all uploaded assets." />
                </span>
                {Object.keys(initialMetadata).length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded-md">
                    {Object.keys(initialMetadata).length} fields set
                  </span>
                )}
              </div>
              {showMetadata ? (
                <ChevronUpIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {showMetadata && (
              <div className="px-6 pb-6 bg-gray-50/30 dark:bg-gray-900/40 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Search Fields */}
                {metadataFields.length > 6 && (
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search metadata fields..."
                      value={metadataSearch}
                      onChange={(e) => setMetadataSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-h-[300px] overflow-y-auto px-1 pt-1 custom-scrollbar">
                  {metadataFields
                    .filter(f => !metadataSearch || f.label.toLowerCase().includes(metadataSearch.toLowerCase()) || f.key.toLowerCase().includes(metadataSearch.toLowerCase()))
                    .map((field) => (
                    <div key={field.id} className="space-y-1 group">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide group-focus-within:text-blue-500 transition-colors truncate">
                          {field.label}
                        </label>
                        <span className="text-[8px] font-medium text-gray-600 dark:text-gray-500 uppercase tracking-tighter">
                          {field.field_type}
                        </span>
                      </div>
                      
                      {field.field_type === 'boolean' ? (
                        <div className="flex items-center h-9 px-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <label className="flex items-center gap-2 cursor-pointer w-full">
                            <input
                              type="checkbox"
                              checked={initialMetadata[field.key] || false}
                              onChange={(e) => setInitialMetadata(prev => ({ ...prev, [field.key]: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-all"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Enabled</span>
                          </label>
                        </div>
                      ) : (
                        <input
                          type={field.field_type === 'integer' || field.field_type === 'float' ? 'number' : 'text'}
                          value={initialMetadata[field.key] || ''}
                          onChange={(e) => setInitialMetadata(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-gray-600"
                        />
                      )}
                    </div>
                  ))}
                  {metadataFields.filter(f => !metadataSearch || f.label.toLowerCase().includes(metadataSearch.toLowerCase()) || f.key.toLowerCase().includes(metadataSearch.toLowerCase())).length === 0 && (
                    <div className="col-span-full py-8 text-center bg-gray-200/5 dark:bg-white/5 rounded-3xl border border-dashed border-gray-700/50">
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No fields matching &quot;{metadataSearch}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary bar */}
        {counts.total > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {counts.done + counts.duplicate} / {counts.total} complete
                {counts.error > 0 && (
                  <span className="text-red-500 ml-2">· {counts.error} failed</span>
                )}
                {counts.duplicate > 0 && (
                  <span className="text-amber-500 ml-2 font-bold tracking-tight bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {counts.duplicate} duplication conflicts found
                  </span>
                )}
              </span>
              <span className="text-gray-500">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Drop zone or File list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar">
          {/* Drop zone — always visible if not at max files */}
          {entries.length < MAX_FILES && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                dragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <CloudArrowUpIcon className={`h-12 w-12 mb-3 transition-colors ${dragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {dragging ? 'Drop files here' : 'Click or drag & drop files'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {entries.length > 0 ? `${entries.length} selected · Add more` : `Images, Videos, 3D Models, PDFs up to ${MAX_FILE_SIZE_MB} MB each`}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.svg,.glb,.gltf"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>
          )}

          {/* File list */}
          {entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry) => {
                const Icon = fileIcon(entry.file);
                const isActive = entry.status === 'uploading';
                const isDuplicate = entry.status === 'duplicate';
                
                return (
                  <div key={entry.id} className="flex flex-col gap-2">
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        entry.status === 'done'
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                          : entry.status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                          : isDuplicate
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 ring-1 ring-amber-500/20 shadow-sm'
                          : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white truncate">{entry.file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">{formatSize(entry.file.size)}</p>
                          {entry.error && !isDuplicate && (
                            <p className="text-xs text-red-500 truncate">{entry.error}</p>
                          )}
                        </div>

                        {isActive && (
                          <div className="mt-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-200"
                              style={{ width: `${entry.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-1">
                        {entry.status === 'done' && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                        {entry.status === 'error' && (
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                        {isDuplicate && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Duplicate</span>
                          </div>
                        )}
                        {entry.status === 'uploading' && (
                          <ArrowPathIcon className="h-5 w-5 text-blue-400 animate-spin" />
                        )}
                        {(entry.status === 'pending' || entry.status === 'error' || isDuplicate) && !running && (
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Duplicate preview box */}
                    {isDuplicate && entry.duplicateAsset && (
                      <div className="ml-9 mr-2 p-3 bg-amber-50/50 dark:bg-amber-900/5 rounded-2xl border border-amber-200/50 dark:border-amber-800/10 flex items-center gap-4 animate-in slide-in-from-top-1 duration-200">
                        <div className="h-16 w-16 bg-white dark:bg-gray-950 rounded-lg overflow-hidden border border-amber-200 dark:border-amber-800 shadow-inner flex-shrink-0">
                          {entry.file.type.startsWith('image/') ? (
                            <img 
                              src={`${BASE_URL}/assets/${entry.duplicateAsset.id}/view`} 
                              className="h-full w-full object-cover" 
                              alt="Existing duplicate" 
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <DocumentIcon className="h-6 w-6 text-amber-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Found Match in Library</p>
                          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium truncate mb-2">{entry.duplicateAsset.original_name}</p>
                          {!running && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  updateEntry(entry.id, { force: true });
                                  setTimeout(() => uploadAll(), 0);
                                }}
                                className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 underline uppercase tracking-widest"
                              >
                                Skip and upload anyway
                              </button>
                              <span className="text-gray-300 dark:text-gray-700">|</span>
                              <a
                                href={`/dashboard/assets/${entry.duplicateAsset.id}`}
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="text-xs text-gray-500">
            {counts.total === 0
              ? 'No files selected'
              : `${counts.pending + counts.uploading} active · ${counts.done} done · ${counts.duplicate} skipped`}
          </div>
          <div className="flex items-center gap-3">
            {done && counts.error > 0 && (
              <button
                onClick={retryFailed}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-300 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Retry Failed ({counts.error})
              </button>
            )}
            {done && counts.duplicate > 0 && (
              <button
                onClick={forceAllDuplicates}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-amber-600 border border-amber-300 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                Force All Duplicates ({counts.duplicate})
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {done ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={uploadAll}
              disabled={running || counts.pending === 0}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
