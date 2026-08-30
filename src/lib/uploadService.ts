import { BASE_URL } from './api';
import {
  PhotoIcon,
  VideoCameraIcon,
  CubeTransparentIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export const CONCURRENCY = 5;
export const MAX_FILES = 500;
export const MAX_FILE_SIZE_MB = 5120;

export type FileStatus = 'pending' | 'uploading' | 'done' | 'error' | 'duplicate';

export interface FileEntry {
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

export function fileIcon(file: File) {
  if (file.type.startsWith('image/')) return PhotoIcon;
  if (file.type.startsWith('video/')) return VideoCameraIcon;
  if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) return CubeTransparentIcon;
  return DocumentIcon;
}

export function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export class DuplicateError extends Error {
  public asset?: { id: string; original_name: string; asset_live_url?: string };
  constructor(message: string, asset?: Record<string, unknown>) {
    super(message);
    this.name = 'DuplicateError';
    if (asset) {
      this.asset = {
        id: (asset.id as string) || '',
        original_name: (asset.originalName as string) || (asset.original_name as string) || '',
        asset_live_url: asset.asset_live_url as string | undefined,
      };
    }
  }
}

export async function uploadFileSingle(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, unknown> = {},
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
        const body = (await initRes.json().catch(() => ({}))) as Record<string, string>;
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
          force,
        }),
      });

      if (!finalizeRes.ok) {
        const body = (await finalizeRes.json().catch(() => ({}))) as Record<string, string>;
        throw new Error(body.message || `Finalize failed (${finalizeRes.status})`);
      }

      resolve();
    } catch (err: unknown) {
      reject(err);
    }
  });
}

export async function uploadFileMultipart(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, unknown> = {},
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
    await Promise.all(batch.map(async (part: { part_number?: number; partNumber?: number; url: string }) => {
      const pNumber = part.part_number || part.partNumber || 1;
      
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
        force,
      }
    }),
  });

  if (!finalizeRes.ok) {
    const body = (await finalizeRes.json().catch(() => ({}))) as Record<string, string>;
    throw new Error(body.message || `Finalize failed (${finalizeRes.status})`);
  }
}

export function uploadFileXHR(
  file: File,
  workspaceId: string,
  token: string | null,
  onProgress: (pct: number) => void,
  categoryIds: string[] = [],
  vaultId: string | null = null,
  force: boolean = false,
  metadata: Record<string, unknown> = {},
  relativePath?: string
): Promise<void | { id: string; original_name: string }> {
  if (file.size > 10 * 1024 * 1024) {
    return uploadFileMultipart(file, workspaceId, token, onProgress, categoryIds, vaultId, force, metadata, relativePath);
  } else {
    return uploadFileSingle(file, workspaceId, token, onProgress, categoryIds, vaultId, force, metadata, relativePath);
  }
}
