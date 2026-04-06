'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface Vault {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  created_by: string;
  created_at: string;
}

export function useVaults() {
  const { activeWorkspace } = useWorkspace();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaults = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      setError(null);
      // Backend uses /workspaces/:workspaceId/vaults
      const data = await apiFetch<Vault[]>(`/workspaces/${activeWorkspace.id}/vaults`);
      setVaults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vaults');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const createVault = async (name: string, description?: string) => {
    if (!activeWorkspace) return;
    try {
      const data = await apiFetch<Vault>(`/workspaces/${activeWorkspace.id}/vaults`, {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      await fetchVaults();
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateVault = async (vaultId: string, name?: string, description?: string) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/vaults/${vaultId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
      });
      await fetchVaults();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteVault = async (vaultId: string) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/vaults/${vaultId}`, {
        method: 'DELETE',
      });
      await fetchVaults();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    vaults,
    loading,
    error,
    refresh: fetchVaults,
    createVault,
    updateVault,
    deleteVault,
  };
}
