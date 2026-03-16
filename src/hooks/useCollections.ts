'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  workspaceId: string;
  customerId: string;
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

  const createCollection = async (name: string, description?: string) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch('/collections', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          workspace_id: activeWorkspace.id,
          customer_id: (activeWorkspace as any).customerId,
        }),
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

  return {
    collections,
    loading,
    error,
    refresh: fetchCollections,
    createCollection,
    addAssetsToCollection,
  };
}
