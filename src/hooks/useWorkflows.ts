'use client';

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Workflow, AssetWorkflow, WorkflowTask, WorkflowTaskStatus } from '@/types/workflow';

export function useWorkflows() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWorkflow = useCallback(async (assetId: string, workflowId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch<AssetWorkflow>(`/workflows/assets/${assetId}/start`, {
        method: 'POST',
        body: JSON.stringify({ workflow_id: workflowId }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processTask = useCallback(async (taskId: string, status: WorkflowTaskStatus, comment?: string) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch<{ status: string }>(`/workflows/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, comment }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Assuming we have an endpoint for this, if not we'll need to create it
      return await apiFetch<WorkflowTask[]>('/workflows/tasks/my');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssetWorkflow = useCallback(async (assetId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch<AssetWorkflow>(`/workflows/assets/${assetId}/active`);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkflows = useCallback(async (workspaceId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = workspaceId ? `/workflows?workspace_id=${workspaceId}` : '/workflows';
      return await apiFetch<Workflow[]>(url);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflows');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (data: Partial<Workflow> & { workspace_id: string }) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch<Workflow>('/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkflow = useCallback(async (id: string, data: Partial<Workflow>) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch<Workflow>(`/workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/workflows/${id}`, { method: 'DELETE' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addStage = useCallback(async (workflowId: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch(`/workflows/${workflowId}/stages`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStage = useCallback(async (stageId: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFetch(`/workflows/stages/${stageId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStage = useCallback(async (stageId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/workflows/stages/${stageId}`, { method: 'DELETE' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    startWorkflow,
    processTask,
    fetchMyTasks,
    fetchAssetWorkflow,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addStage,
    updateStage,
    deleteStage,
  };
}
