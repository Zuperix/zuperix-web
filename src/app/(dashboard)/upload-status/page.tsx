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
  DocumentIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

function StatusBadge({ status, onClick }: { status: string; onClick?: (e: React.MouseEvent) => void }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    processing: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 animate-pulse',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    failed: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    duplicate: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer',
  };

  const icons: Record<string, React.ReactNode> = {
    pending: <ArrowPathIcon className="h-3 w-3" />,
    processing: <ArrowPathIcon className="h-3 w-3 animate-spin" />,
    completed: <CheckCircleIcon className="h-3 w-3" />,
    failed: <XCircleIcon className="h-3 w-3" />,
    duplicate: <ExclamationCircleIcon className="h-3 w-3" />,
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${styles[status] || styles.pending}`}
    >
      {icons[status] || icons.pending}
      {label}
    </span>
  );
}

import AssetMatchesModal from '@/components/AssetMatchesModal';

interface UploadAsset {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  processing_status: string;
}

interface UploadStatusResponse {
  results: UploadAsset[];
  pagination: {
    page: number;
    total_pages: number;
  };
}

function UploadStatusContent() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('start_date') || '';
  const endDate = searchParams.get('end_date') || '';
  const uploadedByMe = searchParams.get('uploaded_by_me') === 'true';
  
  const [data, setData] = useState<UploadStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<UploadAsset | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/assets/upload-status?page=${page}&limit=20`;
      if (activeWorkspace) url += `&workspace_id=${activeWorkspace.id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (uploadedByMe) url += `&uploaded_by_me=true`;
      
      const response = await apiFetch<UploadStatusResponse>(url);
      setData(response);
    } catch (error) {
      console.error('Failed to fetch upload status:', error);
      toast.error('Failed to load upload statuses');
    } finally {
      setLoading(false);
    }
  }, [page, activeWorkspace, search, status, startDate, endDate, uploadedByMe]);

  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds while on this page
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`/upload-status?${params.toString()}`);
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
            Upload Status
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tracking recent asset processing and background jobs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="relative group md:col-span-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search filename..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilters({ search: (e.target as HTMLInputElement).value });
              }
            }}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f111a]/60 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-gray-100"
          />
        </div>

        <div className="relative group">
          <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <select
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f111a]/60 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-gray-100 appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="duplicate">Duplicate</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="relative group md:col-span-2 flex items-center gap-2 bg-white dark:bg-[#0f111a]/60 border border-gray-200 dark:border-gray-800 rounded-2xl px-4">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            onChange={(e) => updateFilters({ start_date: e.target.value })}
            className="flex-1 py-3 bg-transparent border-none text-sm outline-none dark:text-gray-100 focus:ring-0 cursor-pointer"
          />
          <span className="text-gray-400 text-xs font-bold uppercase">To</span>
          <input
            type="date"
            value={endDate}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            onChange={(e) => updateFilters({ end_date: e.target.value })}
            className="flex-1 py-3 bg-transparent border-none text-sm outline-none dark:text-gray-100 focus:ring-0 cursor-pointer"
          />
          {(startDate || endDate) && (
            <button 
              onClick={() => updateFilters({ start_date: '', end_date: '' })}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <button
            onClick={() => updateFilters({ uploaded_by_me: uploadedByMe ? '' : 'true' })}
            className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all duration-200 flex items-center justify-center gap-2 shadow-sm w-full h-full ${
              uploadedByMe
                ? 'bg-blue-500 hover:bg-blue-600 border-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-600'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 dark:bg-[#0f111a]/60 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/50'
            }`}
          >
            <span>Uploaded by you</span>
            {uploadedByMe && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f111a]/40 border border-gray-200 dark:border-gray-800/60 rounded-3xl overflow-hidden shadow-xl shadow-black/5 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/20">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">File</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Size</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                    No recent uploads found.
                  </td>
                </tr>
              ) : (
                data?.results?.map((asset) => (
                  <tr 
                    key={asset.id} 
                    className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (asset.processing_status === 'completed') {
                        router.push(`/assets/${asset.id}`);
                      } else if (asset.processing_status === 'duplicate') {
                        setSelectedAsset(asset);
                      }
                    }}
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
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                            {asset.mime_type?.split('/')[1] || 'file'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={asset.processing_status} 
                        onClick={(e) => {
                          if (asset.processing_status === 'duplicate') {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                          }
                        }}
                      />
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

      {selectedAsset && (
        <AssetMatchesModal 
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
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
