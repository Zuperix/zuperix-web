'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  workspace_id: string;
  customer_id: string;
  is_smart: boolean;
  smart_filter: any;
  is_global: boolean;
  asset_count: number;
}

export function useCollections() {
  const { activeWorkspace } = useWorkspace();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Collection[]>(`/collections?workspace_id=${activeWorkspace.id}`);
      setCollections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (name: string, description?: string, isSmart: boolean = false, smartFilter: any = null, isGlobal: boolean = false) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch('/collections', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          workspace_id: activeWorkspace.id,
          customer_id: (activeWorkspace as any).customer_id,
          is_smart: isSmart,
          smart_filter: smartFilter,
          is_global: isGlobal,
        }),
      });
      await fetchCollections();
    } catch (err: any) {
      throw err;
    }
  };

  const updateCollection = async (id: string, body: { name?: string; description?: string; is_smart?: boolean; smart_filter?: any; is_global?: boolean }) => {
    try {
      await apiFetch(`/collections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      await fetchCollections();
    } catch (err: any) {
      throw err;
    }
  };

  const addAssetsToCollection = async (collectionId: string, assetIds: string[]) => {
    try {
      await apiFetch(`/collections/${collectionId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: assetIds }),
      });
    } catch (err: any) {
      throw err;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await apiFetch(`/collections/${id}`, { method: 'DELETE' });
      await fetchCollections();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    collections,
    loading,
    error,
    refresh: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addAssetsToCollection,
  };
}
