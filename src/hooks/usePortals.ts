'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface Portal {
  id: string;
  name: string;
  slug: string;
  description?: string;
  welcome_title?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image_url?: string;
  background_color?: string;
  expires_at?: string;
  password?: string;
  settings?: any;
  created_at: string;
}


export function usePortals() {
  const { activeWorkspace } = useWorkspace();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Portal[]>('/portals');
      setPortals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch portals');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPortal = useCallback(async (id: string) => {
    try {
      return await apiFetch<Portal>(`/portals/${id}`);
    } catch (err: any) {
      throw err;
    }
  }, []);

  const getPortalAssets = useCallback(async (id: string) => {
    try {
      return await apiFetch<any>(`/portals/${id}/assets`);
    } catch (err: any) {
      throw err;
    }
  }, []);

  const createPortal = useCallback(async (name: string, slug: string, description?: string) => {
    try {
      await apiFetch('/portals', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug,
          description,
        }),
      });
      await fetchPortals();
    } catch (err: any) {
      throw err;
    }
  }, [fetchPortals]);

  const deletePortal = useCallback(async (id: string) => {
    try {
      await apiFetch(`/portals/${id}`, {
        method: 'DELETE',
      });
      await fetchPortals();
    } catch (err: any) {
      throw err;
    }
  }, [fetchPortals]);

  const updatePortal = useCallback(async (id: string, dto: Partial<Portal>) => {
    try {
      await apiFetch(`/portals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      await fetchPortals();
    } catch (err: any) {
      throw err;
    }
  }, [fetchPortals]);

  const addAssetsToPortal = useCallback(async (portalId: string, assetIds: string[]) => {
    return apiFetch(`/portals/${portalId}/assets`, {
      method: 'POST',
      body: JSON.stringify({ asset_ids: assetIds }),
    });
  }, []);

  return {
    portals,
    loading,
    error,
    refresh: fetchPortals,
    createPortal,
    deletePortal,
    addAssetsToPortal,
    updatePortal,
    getPortal,
    getPortalAssets,
  };
}
