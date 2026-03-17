'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { AuditLogEntry } from '@/types/audit';

export function useAssetHistory(assetId: string) {
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<AuditLogEntry[]>(`/audit/assets/${assetId}`);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset history');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    if (assetId) {
      fetchHistory();
    }
  }, [assetId, fetchHistory]);

  return { history, loading, error, refresh: fetchHistory };
}
