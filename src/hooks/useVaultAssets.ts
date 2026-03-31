'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export function useVaultAssets(vaultId?: string) {
  const { activeWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!activeWorkspace || !vaultId) return;
    try {
      setLoading(true);
      setError(null);
      // Backend: GET /workspaces/:workspaceId/vaults/:vaultId/assets
      const data = await apiFetch<any[]>(`/workspaces/${activeWorkspace.id}/vaults/${vaultId}/assets`);
      setAssets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vault assets');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace, vaultId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAssetsToVault = async (assetIds: string[]) => {
    if (!activeWorkspace || !vaultId) return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/vaults/${vaultId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: assetIds }),
      });
      await fetchAssets();
    } catch (err: any) {
      throw err;
    }
  };

  const removeAssetsFromVault = async (assetIds: string[]) => {
    if (!activeWorkspace || !vaultId) return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/vaults/${vaultId}/assets`, {
        method: 'DELETE',
        body: JSON.stringify({ asset_ids: assetIds }),
      });
      await fetchAssets();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    assets,
    loading,
    error,
    refresh: fetchAssets,
    addAssetsToVault,
    removeAssetsFromVault,
  };
}
