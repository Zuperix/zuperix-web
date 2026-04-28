import { apiFetch } from '@/lib/api';

export interface CanvaConnection {
  id: string;
  canva_user_id: string;
  canva_team_id: string | null;
  canva_display_name: string;
  workspace_id: string;
  is_active: boolean;
  last_sync_at: string | null;
}

export interface CanvaAsset {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  insert_url: string | null;
  tags: string[];
  collections: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  source: string;
  is_imported: boolean;
}

export interface CanvaSearchResponse {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  facets: Array<{
    key: string;
    label: string;
    options: Array<{ key: string; count: number; label?: string; active?: boolean }>;
  }>;
  assets: CanvaAsset[];
}

export interface CanvaExportJob {
  id: string;
  status: string;
  canva_design_id: string;
  export_format: string;
  target_asset_id: string | null;
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
}

export const canvaApi = {
  getAuthUrl: (workspaceId: string) =>
    apiFetch<{ auth_url: string }>(`/canva/auth/url?workspace_id=${workspaceId}`),

  callback: (code: string, state: string) =>
    apiFetch<CanvaConnection>('/canva/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),

  getConnection: (workspaceId: string) =>
    apiFetch<{ connection: CanvaConnection | null }>(
      `/canva/connections?workspace_id=${workspaceId}`,
    ),

  disconnect: (workspaceId: string, connectionId: string) =>
    apiFetch<{ success: boolean }>(
      `/canva/connections/${connectionId}?workspace_id=${workspaceId}`,
      {
      method: 'DELETE',
      },
    ),

  searchAssets: (params: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        qp.set(key, String(value));
      }
    });
    return apiFetch<CanvaSearchResponse>(`/canva/assets/search?${qp.toString()}`);
  },

  getRecentAssets: (workspaceId: string) =>
    apiFetch<{ assets: CanvaAsset[] }>(
      `/canva/assets/recent?workspace_id=${workspaceId}`,
    ),

  getFolders: (workspaceId: string) =>
    apiFetch<{
      categories: Array<{ id: string; name: string }>;
      collections: Array<{ id: string; name: string }>;
    }>(`/canva/folders?workspace_id=${workspaceId}`),

  getFavorites: (workspaceId: string, connectionId: string) =>
    apiFetch<{ assets: CanvaAsset[] }>(
      `/canva/assets/favorites?workspace_id=${workspaceId}&connection_id=${connectionId}`,
    ),

  toggleFavorite: (workspaceId: string, connectionId: string, assetId: string) =>
    apiFetch<{ is_favorite: boolean }>(`/canva/assets/${assetId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, connection_id: connectionId }),
    }),

  markInsert: (workspaceId: string, connectionId: string, assetId: string) =>
    apiFetch<{ success: boolean }>(`/canva/assets/${assetId}/insert`, {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, connection_id: connectionId }),
    }),

  createExport: (payload: {
    workspace_id: string;
    canva_design_id: string;
    export_format: 'PNG' | 'JPG' | 'PDF';
    export_download_url: string;
    file_name?: string;
    existing_asset_id?: string;
    destination_category_id?: string;
  }) =>
    apiFetch<{ id: string; status: string; created_at: string }>('/canva/exports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listExports: (workspaceId: string) =>
    apiFetch<CanvaExportJob[]>(`/canva/exports?workspace_id=${workspaceId}`),
};
