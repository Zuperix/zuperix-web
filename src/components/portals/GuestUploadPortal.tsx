'use client';

import { useState, useRef, useCallback, useEffect, DragEvent } from 'react';
import { apiFetch, BASE_URL } from '@/lib/api';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  CubeTransparentIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const CONCURRENCY = 3;
const CHUNK_SIZE = 10 * 1024 * 1024;

type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
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

// Re-using the logic from UploadModal for direct and multipart but hitting the guest endpoints
async function uploadFileGuest(
  file: File,
  token: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  const isMultipart = file.size > CHUNK_SIZE;

  if (isMultipart) {
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    
    // 1. Init multipart
    const initData = await apiFetch<any>(`/guest-uploads/public/${token}/upload/multipart/init`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
      })
    });
    const { upload_id, key } = initData;

    // 2. URLs
    const urlsData = await apiFetch<any[]>(`/guest-uploads/public/${token}/upload/multipart/urls`, {
      method: 'POST',
      body: JSON.stringify({ key, upload_id, parts: totalParts }),
    });

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
              completedParts.push({ partNumber: pNumber, etag: rawEtag || `"cf23df2207d99a74fbe169e3eba035e6"` });
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
    await apiFetch(`/guest-uploads/public/${token}/upload/multipart/complete`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        upload_id,
        parts: completedParts,
        finalize_data: {
          key,
          filename: file.name,
          original_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
        }
      }),
    });

  } else {
    // Direct upload
    const initData = await apiFetch<any>(`/guest-uploads/public/${token}/upload/init`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
      })
    });
    const { url, key, method } = initData;

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
      xhr.open(method || 'PUT', url);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });

    await apiFetch(`/guest-uploads/public/${token}/upload/finalize`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        filename: file.name,
        original_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
      })
    });
  }
}

export default function GuestUploadPortal({ token }: { token: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token || token === 'undefined') {
      setLoading(false);
      setError('Invalid upload link');
      return;
    }

    apiFetch<any>(`/guest-uploads/public/${token}`)
      .then(data => {
        setConfig(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load link details');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid = arr.filter((f) => {
      // client-side validation
      if (config.max_file_size && f.size > config.max_file_size) return false;
      if (config.allowed_types && config.allowed_types.length > 0 && !config.allowed_types.includes('all')) {
        const fileTypeCategory = f.type?.split('/')[0];
        if (!config.allowed_types.includes(fileTypeCategory) && !config.allowed_types.includes(f.type)) {
          return false;
        }
      }
      return true;
    });

    const newEntries: FileEntry[] = valid.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  }, [config]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!running && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const updateEntry = (id: string, patch: Partial<FileEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const uploadAll = async () => {
    setRunning(true);

    const pending = entries.filter((e) => e.status === 'pending' || e.status === 'error');
    let i = 0;

    const next = async (): Promise<void> => {
      const entry = pending[i++];
      if (!entry) return;

      updateEntry(entry.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        await uploadFileGuest(entry.file, token, (pct) => {
          updateEntry(entry.id, { progress: pct });
        });
        updateEntry(entry.id, { status: 'done', progress: 100 });
      } catch (err: any) {
        updateEntry(entry.id, { status: 'error', progress: 0, error: err.message });
      }

      return next();
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => next());
    await Promise.all(workers);

    setRunning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
         <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const allDone = entries.length > 0 && entries.every(e => e.status === 'done');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="h-12 flex items-center gap-2">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Zuperix</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Upload to {config.workspace_name}
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto font-medium">
            You&apos;ve been invited to directly upload assets. Drag and drop your files securely below.
          </p>
        </div>

        {allDone ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
               <CheckCircleIcon className="h-12 w-12 text-green-500" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h2>
             <p className="text-gray-500 font-medium">Your assets have been securely transferred to the workspace.</p>
             <button 
               onClick={() => { setEntries([]); }}
               className="mt-8 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
             >
               Upload More
             </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">

            <div className="p-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !running && fileInputRef.current?.click()}
                className={`relative group flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                  dragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : running ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <CloudArrowUpIcon className={`h-16 w-16 mb-4 transition-colors ${dragging ? 'text-blue-500' : 'text-gray-300 group-hover:text-blue-400'}`} />
                <p className="text-lg font-bold text-gray-800">
                  {dragging ? 'Drop files here to upload' : 'Click or drop files here'}
                </p>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {config.allowed_types?.includes('all') ? 'Any file type supported' : `Supported: ${config.allowed_types?.join(', ')}`}
                  {config.max_file_size && ` (Max ${formatSize(config.max_file_size)})`}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => !running && e.target.files && addFiles(e.target.files)}
                />
              </div>

              {entries.length > 0 && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Selected Files ({entries.length})</h3>
                    {!running && entries.some(e => e.status !== 'done') && (
                      <button 
                        onClick={uploadAll} 
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                      >
                        Start Upload
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {entries.map((entry) => {
                      const Icon = fileIcon(entry.file);
                      const isActive = entry.status === 'uploading';
                      
                      return (
                        <div key={entry.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                            <Icon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{entry.file.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500 font-medium">{formatSize(entry.file.size)}</p>
                              {entry.error && <p className="text-xs text-red-500 font-bold truncate">• {entry.error}</p>}
                            </div>
                            {isActive && (
                              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-200"
                                  style={{ width: `${entry.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {entry.status === 'done' && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
                            {entry.status === 'error' && <ExclamationCircleIcon className="h-6 w-6 text-red-500" />}
                            {entry.status === 'uploading' && <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />}
                            {(entry.status === 'pending' || entry.status === 'error') && !running && (
                              <button
                                onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
