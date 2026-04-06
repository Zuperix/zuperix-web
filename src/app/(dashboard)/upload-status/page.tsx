'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import Pagination from '@/components/Pagination';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    processing: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 animate-pulse',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    failed: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    duplicate: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  };

  const icons: Record<string, any> = {
    pending: <ArrowPathIcon className="h-3 w-3" />,
    processing: <ArrowPathIcon className="h-3 w-3 animate-spin" />,
    completed: <CheckCircleIcon className="h-3 w-3" />,
    failed: <XCircleIcon className="h-3 w-3" />,
    duplicate: <ExclamationCircleIcon className="h-3 w-3" />,
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.pending}`}>
      {icons[status] || icons.pending}
      {label}
    </span>
  );
}

function UploadStatusContent() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/assets/upload-status?page=${page}&limit=20${activeWorkspace ? `&workspace_id=${activeWorkspace.id}` : ''}`;
      const response = await apiFetch<any>(url);
      setData(response);
    } catch (error) {
      console.error('Failed to fetch upload status:', error);
      toast.error('Failed to load upload statuses');
    } finally {
      setLoading(false);
    }
  }, [page, activeWorkspace]);

  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds while on this page
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/upload-status?${params.toString()}`);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
            Upload Status
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tracking recent asset processing and background jobs
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f111a]/40 border border-gray-200 dark:border-gray-800/60 rounded-3xl overflow-hidden shadow-xl shadow-black/5 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/20">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">File</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Workspace</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Size</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                    No recent uploads found.
                  </td>
                </tr>
              ) : (
                data?.results?.map((asset: any) => (
                  <tr 
                    key={asset.id} 
                    className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group cursor-pointer"
                    onClick={() => asset.processing_status === 'completed' && router.push(`/assets/${asset.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center border border-gray-200 dark:border-gray-700/50 group-hover:border-blue-500/30 transition-all shadow-sm">
                          <DocumentIcon className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[240px]">
                            {asset.original_name}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider uppercase">
                            {asset.mime_type?.split('/')[1] || 'file'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-2.5 py-1 rounded-lg">
                        {asset.workspace?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={asset.processing_status} />
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {formatSize(asset.size)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-500 font-medium">
                      {new Date(asset.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {data?.pagination && (
          <div className="p-4 bg-gray-50/30 dark:bg-gray-900/10 border-t border-gray-100 dark:border-gray-800/40">
            <Pagination 
              currentPage={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadStatusPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <UploadStatusContent />
    </Suspense>
  );
}
