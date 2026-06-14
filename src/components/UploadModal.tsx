'use client';

import { useState, useRef, useCallback, DragEvent, useEffect } from 'react';
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
import { BASE_URL, apiFetch } from '@/lib/api';
import { useCategories, Category } from '@/hooks/useCategories';
import { useVaults } from '@/hooks/useVaults';
import { useMetadataFields, MetadataField } from '@/hooks/useMetadataFields';
import { LockClosedIcon } from '@heroicons/react/20/solid';
import PdfPreview from './PdfPreview';
import { MetadataFieldInput } from './metadata/MetadataFieldInput';

const CONCURRENCY = 5;
const MAX_FILES = 500;
const MAX_FILE_SIZE_MB = 5120;

type FileStatus = 'pending' | 'uploading' | 'done' | 'error' | 'duplicate';

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  relativePath?: string;
  duplicateAsset?: {
    id: string;
    original_name: string;
    asset_live_url?: string;
  };
  force?: boolean;
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

async function uploadFileSingle(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, any> = {},
  relativePath?: string
): Promise<void | { id: string; original_name: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Init Upload via backend
      const initRes = await fetch(`${BASE_URL}/assets/upload/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
          vault_id: vaultId,
        }),
      });

      if (!initRes.ok) {
        const body: any = await initRes.json().catch(() => ({}));
        throw new Error(body.message || `Init failed (${initRes.status})`);
      }

      const initBody = await initRes.json();
      const { url, key, method } = initBody.data;

      // 2. Direct upload to Storage (S3 / Local Proxy)
      await new Promise<void>((uploadResolve, uploadReject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            uploadResolve();
          } else {
            uploadReject(new Error(`Storage upload failed (${xhr.status})`));
          }
        };

        xhr.onerror = () => uploadReject(new Error('Network error during storage transfer'));
        xhr.ontimeout = () => uploadReject(new Error('Storage transfer timed out'));
        xhr.timeout = 300_000; // 5 mins for large files directly to storage

        xhr.open(method || 'PUT', url);
        // Important: S3 presigned PUT requires the exact Content-Type that was signed
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // 3. Finalize upload
      const finalizeRes = await fetch(`${BASE_URL}/assets/upload/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          key,
          filename: file.name,
          original_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
          category_ids: categoryIds,
          vault_id: vaultId,
          metadata,
          relative_path: relativePath,
        }),
      });

      if (!finalizeRes.ok) {
        const body: any = await finalizeRes.json().catch(() => ({}));
        throw new Error(body.message || `Finalize failed (${finalizeRes.status})`);
      }

      resolve();
    } catch (err: any) {
      reject(err);
    }
  });
}

async function uploadFileMultipart(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, any> = {},
  relativePath?: string
): Promise<void | { id: string; original_name: string }> {
  const CHUNK_SIZE = 10 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  // 1. Initial request
  const initRes = await fetch(`${BASE_URL}/assets/upload/multipart/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      size: file.size,
      vault_id: vaultId,
    }),
  });

  if (!initRes.ok) throw new Error('Init multipart failed');
  const initBody = await initRes.json();
  const { upload_id, key } = initBody.data;

  // 2. Fetch URLs
  const urlsRes = await fetch(`${BASE_URL}/assets/upload/multipart/urls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ workspace_id: workspaceId, key, upload_id, parts: totalParts }),
  });

  if (!urlsRes.ok) throw new Error('Fetch multipart URLs failed');
  const urlsData = (await urlsRes.json()).data;

  // 3. Upload parts concurrently
  let uploadedBytes = 0;
  const completedParts: { partNumber: number; etag: string }[] = [];
  const CONCURRENCY_LIMIT = 3;

  for (let i = 0; i < urlsData.length; i += CONCURRENCY_LIMIT) {
    const batch = urlsData.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(batch.map(async (part: any) => {
      const pNumber = part.part_number || part.partNumber;
      
      const start = (pNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let lastLoaded = 0;
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            uploadedBytes += (e.loaded - lastLoaded);
            lastLoaded = e.loaded;
            onProgress(Math.round((uploadedBytes / file.size) * 100));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const rawEtag = xhr.getResponseHeader('ETag');
            const fallbackEtag = rawEtag || `"cf23df2207d99a74fbe169e3eba035e6"`;
            completedParts.push({ partNumber: pNumber, etag: fallbackEtag });
            resolve();
          } else {
            reject(new Error(`Chunk upload failed`));
          }
        };
        xhr.onerror = () => reject(new Error('Chunk upload network error'));
        xhr.open('PUT', part.url);
        xhr.send(chunk);
      });
    }));
  }

  // 4. Complete
  const finalizeRes = await fetch(`${BASE_URL}/assets/upload/multipart/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      key,
      upload_id: upload_id,
      parts: completedParts,
      finalize_data: {
        workspace_id: workspaceId,
        key,
        filename: file.name,
        original_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
        category_ids: categoryIds,
        vault_id: vaultId,
        metadata,
        relative_path: relativePath,
      }
    }),
  });

  if (!finalizeRes.ok) {
    const body: any = await finalizeRes.json().catch(() => ({}));
    throw new Error(body.message || `Finalize failed (${finalizeRes.status})`);
  }
}

function uploadFileXHR(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, any> = {},
  relativePath?: string
): Promise<void | { id: string; original_name: string }> {
  // If > 10MB, use Multipart
  if (file.size > 10 * 1024 * 1024) {
    return uploadFileMultipart(file, workspaceId, token, onProgress, categoryIds, vaultId, force, metadata, relativePath);
  } else {
    return uploadFileSingle(file, workspaceId, token, onProgress, categoryIds, vaultId, force, metadata, relativePath);
  }
}

class DuplicateError extends Error {
  public asset?: { id: string; original_name: string; asset_live_url?: string };
  constructor(message: string, asset?: any) {
    super(message);
    this.name = 'DuplicateError';
    if (asset) {
      this.asset = {
        id: asset.id,
        original_name: asset.originalName || asset.original_name,
        asset_live_url: asset.asset_live_url,
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
  const folderInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // Category & Vault selection state
  const { categories } = useCategories();
  const { vaults } = useVaults();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');

  // Helper to flatten categories for the select dropdown
  const flattenCategories = (cats: Category[], depth = 0): { id: string, name: string, depth: number, metadata_template_id: string | null }[] => {
    let result: { id: string, name: string, depth: number, metadata_template_id: string | null }[] = [];
    cats.forEach(cat => {
      result.push({ id: cat.id, name: cat.name, depth, metadata_template_id: cat.metadata_template_id });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, depth + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  // Metadata state
  const { fields: metadataFields } = useMetadataFields(workspaceId);
  const [initialMetadata, setInitialMetadata] = useState<Record<string, any>>({});
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataSearch, setMetadataSearch] = useState('');
  const [activeTemplateFields, setActiveTemplateFields] = useState<string[] | null>(null);

  useEffect(() => {
    if (!selectedCategoryId) {
      setActiveTemplateFields(null);
      return;
    }
    const cat = flatCategories.find(c => c.id === selectedCategoryId);
    if (cat?.metadata_template_id) {
      apiFetch<any>(`/workspaces/${workspaceId}/metadata/templates/${cat.metadata_template_id}`)
        .then(data => {
          setActiveTemplateFields(data.field_ids || data.fieldIds || []);
          setShowMetadata(true); // Auto expand required template fields
        })
        .catch(() => setActiveTemplateFields(null));
    } else {
      setActiveTemplateFields(null);
    }
  }, [selectedCategoryId, workspaceId, flatCategories]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_FILES - entries.length);
    const valid = arr.filter((f) => {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
    const newEntries: FileEntry[] = valid.map((f) => {
      let relativePath = undefined;
      const path = (f as any).webkitRelativePath || (f as any).path;
      if (path) {
        const lastSlash = path.lastIndexOf('/');
        if (lastSlash !== -1) {
          relativePath = path.substring(0, lastSlash);
        }
      }

      return {
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
        file: f,
        status: 'pending',
        progress: 0,
        relativePath,
      };
    });
    setEntries((prev) => [...prev, ...newEntries]);
  }, [entries.length]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const items = e.dataTransfer.items;
    if (!items) {
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
      return;
    }

    const files: File[] = [];
    const traverseEntry = async (entry: any, path = "") => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        if (path) {
          // Attach custom path property since webkitRelativePath is often read-only
          (file as any).path = path + "/" + file.name;
        }
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise<any[]>((resolve) => {
          let allEntries: any[] = [];
          const read = () => {
            reader.readEntries((results: any[]) => {
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
          await traverseEntry(child, path ? path + "/" + entry.name : entry.name);
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
        }, categoryIds, selectedVaultId || null, entry.force, initialMetadata, entry.relativePath);
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

    setEntries((prev) =>
      prev.map((entry) =>
        entry.status === 'error' || entry.status === 'duplicate'
          ? entry
          : { ...entry, status: 'done', progress: 100 }
      )
    );

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

  const missingRequiredFields = (metadataFields || []).filter(f => {
    if (!f.is_required) return false;
    const val = initialMetadata[f.key];
    return val === undefined || val === null || val === '';
  });

  const isMetadataValid = missingRequiredFields.length === 0;

  const overallProgress =
    counts.total === 0
      ? 0
      : Math.round(
          entries.reduce((acc, e) => acc + (e.status === 'done' || e.status === 'duplicate' ? 100 : e.progress), 0) /
            counts.total,
        );

  const completedCount = done ? counts.total : counts.done + counts.duplicate;



  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Bulk Upload</h2>
            <p className="text-xs text-gray-500 mt-0.5">Up to {MAX_FILES} items · 5 GB each</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Category Selector */}
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
                    .filter(f => !selectedCategoryId || (activeTemplateFields && activeTemplateFields.includes(f.id)))
                    .filter(f => !metadataSearch || f.label.toLowerCase().includes(metadataSearch.toLowerCase()) || f.key.toLowerCase().includes(metadataSearch.toLowerCase()))
                    .map((field) => (
                      <MetadataFieldInput
                        key={field.id}
                        field={field}
                        value={initialMetadata[field.key]}
                        onChange={(val) => setInitialMetadata(prev => ({ ...prev, [field.key]: val }))}
                      />
                  ))}
                  {metadataFields
                    .filter(f => !selectedCategoryId || (activeTemplateFields && activeTemplateFields.includes(f.id)))
                    .filter(f => !metadataSearch || f.label.toLowerCase().includes(metadataSearch.toLowerCase()) || f.key.toLowerCase().includes(metadataSearch.toLowerCase())).length === 0 && (
                    <div className="col-span-full py-8 text-center bg-gray-200/5 dark:bg-white/5 rounded-3xl border border-dashed border-gray-700/50">
                        {metadataSearch ? (
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No fields matching &quot;{metadataSearch}&quot;</p>
                        ) : (
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No metadata fields required for this category</p>
                        )}
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
              <span className="text-gray-600 dark:text-gray-400" data-testid="upload-status-text">
                {`${completedCount} / ${counts.total} complete`}
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
              <p className="text-xs text-gray-400 mt-1 mb-4 text-center px-4">
                {entries.length > 0 ? `${entries.length} selected · Add more` : `Images, Videos, InDesign, Illustrator, 3D Models, PDFs, CSV, Markdown, JSON up to 5 GB each`}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm"
                >
                  Select Files
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <FolderIcon className="h-4 w-4" />
                  Upload Folder
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,text/csv,.md,text/markdown,.json,application/json,.zip,.svg,.glb,.gltf,.psd,image/vnd.adobe.photoshop,.indd,application/x-indesign,.ai,application/postscript"
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            webkitdirectory=""
            {...({ directory: "" } as any)}
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />

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
                        <p className="text-sm font-medium dark:text-white truncate flex items-center gap-2">
                          {entry.file.name}
                          {entry.relativePath && (
                            <span className="text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <FolderIcon className="h-2.5 w-2.5" />
                              {entry.relativePath}
                            </span>
                          )}
                        </p>
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
                              src={entry.duplicateAsset.asset_live_url} 
                              className="h-full w-full object-cover" 
                              alt="Existing duplicate" 
                            />
                          ) : entry.file.type === 'application/pdf' ? (
                            <PdfPreview 
                              src={entry.duplicateAsset.asset_live_url || ''} 
                              assetId={entry.duplicateAsset.id}
                              className="h-full w-full"
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
              disabled={running || counts.pending === 0 || !isMetadataValid}
              className="group relative flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
