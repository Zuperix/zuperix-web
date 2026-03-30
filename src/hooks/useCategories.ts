'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  depth: number;
  is_smart: boolean;
  smart_filter: any;
  children?: Category[];
}

export function useCategories() {
  const { activeWorkspace } = useWorkspace();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Category[]>(`/categories/tree?workspace_id=${activeWorkspace.id}`);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string, parentId?: string) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name,
          parent_id: parentId,
          workspace_id: activeWorkspace.id,
          customer_id: (activeWorkspace as any).customer_id,
          is_smart: false,
          smart_filter: null,
        }),
      });
      await fetchCategories();
    } catch (err: any) {
      throw err;
    }
  };

  const updateCategory = async (id: string, body: { name?: string; is_smart?: boolean; smart_filter?: any }) => {
    try {
      await apiFetch(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      await fetchCategories();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' });
      await fetchCategories();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
