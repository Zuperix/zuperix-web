import { apiFetch } from '@/lib/api';

export enum DriveImportMode {
  LINK = 'LINK',
  SMART_IMPORT = 'SMART_IMPORT',
  FULL_MIGRATION = 'FULL_MIGRATION',
}

export enum DriveImportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface DriveImportJob {
  id: string;
  mode: DriveImportMode;
  status: DriveImportJobStatus;
  total_files: number;
  processed_files: number;
  failed_files: number;
  skipped_files: number;
  started_at: string;
  completed_at: string | null;
  error_log: string | null;
}

export interface DriveItem {
  id: string;
  name: string;
  mime_type: string;
  icon_link: string;
  thumbnail_link: string | null;
  size: string | null;
  modified_time: string;
}

export interface DriveConnection {
  id: string;
  drive_email: string;
  is_active: boolean;
  last_sync_at: string | null;
}

export const googleDriveApi = {
  getAuthUrl: (workspaceId: string) => 
    apiFetch<{ auth_url: string }>(`/google-drive/auth/url?workspace_id=${workspaceId}`),

  callback: (code: string, state: string) =>
    apiFetch<DriveConnection>('/google-drive/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),

  getConnections: (workspaceId: string) =>
    apiFetch<{ connection: DriveConnection | null }>(`/google-drive/connections?workspace_id=${workspaceId}`),

  disconnect: (connectionId: string) =>
    apiFetch(`/google-drive/connections/${connectionId}`, { method: 'DELETE' }),

  browse: (workspaceId: string, folderId: string = 'root') =>
    apiFetch<{ 
      folders: DriveItem[]; 
      files: DriveItem[]; 
      next_page_token?: string 
    }>(`/google-drive/browse?workspace_id=${workspaceId}&folder_id=${folderId}`),

  linkFolder: (connectionId: string, folderId: string, workspaceId: string) =>
    apiFetch<DriveImportJob>('/google-drive/link', {
      method: 'POST',
      body: JSON.stringify({ connection_id: connectionId, folder_id: folderId, workspace_id: workspaceId }),
    }),

  importAssets: (data: {
    connection_id: string;
    folder_id?: string;
    workspace_id: string;
    mode: DriveImportMode;
    filters?: {
      mime_types?: string[];
      modified_after?: string;
      min_size?: number;
    };
  }) =>
    apiFetch<DriveImportJob>('/google-drive/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getActiveJobs: (workspaceId: string) =>
    apiFetch<DriveImportJob[]>(`/google-drive/import?workspace_id=${workspaceId}`),

  getProgress: (jobId: string) =>
    apiFetch<DriveImportJob>(`/google-drive/import/${jobId}/progress`),

  pauseJob: (jobId: string) =>
    apiFetch(`/google-drive/import/${jobId}/pause`, { method: 'POST' }),

  resumeJob: (jobId: string) =>
    apiFetch(`/google-drive/import/${jobId}/resume`, { method: 'POST' }),

  promoteAsset: (assetId: string) =>
    apiFetch(`/google-drive/assets/${assetId}/promote`, { method: 'POST' }),

  sync: (connectionId: string) =>
    apiFetch(`/google-drive/sync/${connectionId}`, { method: 'POST' }),
};
