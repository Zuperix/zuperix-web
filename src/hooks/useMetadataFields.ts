'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export interface MetadataField {
  id: string;
  workspace_id: string;
  group_id: string | null;
  key: string;
  label: string;
  field_type: string;
  options: any;
  validation_rules: any;
  is_searchable: boolean;
  is_filterable: boolean;
  is_required: boolean;
  default_value: any;
  sort_order: number;
}

export function useMetadataFields(workspaceId: string) {
  const [fields, setFields] = useState<MetadataField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetchFields() {
      try {
        setLoading(true);
        const data = await apiFetch<MetadataField[]>(`/workspaces/${workspaceId}/metadata/fields`);
        setFields(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchFields();
  }, [workspaceId]);

  return { fields, loading, error };
}
