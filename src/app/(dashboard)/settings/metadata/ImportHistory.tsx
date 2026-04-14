'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiDownload } from '@/lib/api';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentArrowDownIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

interface ImportJob {
  id: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  original_filename?: string;
  total_records: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

interface ImportHistoryProps {
  workspaceId: string;
}

export function ImportHistory({ workspaceId }: ImportHistoryProps) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ImportJob[]>(`/workspaces/${workspaceId}/metadata/bulk/history`);
      setJobs(data);
    } catch (err: any) {
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDownloadAudit = async (jobId: string) => {
    try {
      const blob = await apiDownload(`/workspaces/${workspaceId}/metadata/bulk/jobs/${jobId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_full_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      toast.error('Failed to download audit report');
    }
  };

  const handleDownloadRepair = async (jobId: string) => {
    try {
      const blob = await apiDownload(`/workspaces/${workspaceId}/metadata/bulk/jobs/${jobId}/repair`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repair_metadata_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      toast.error('Failed to download repair CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-gray-900/20 border border-gray-800 rounded-2xl border-dashed">
        <ArrowPathIcon className="h-8 w-8 text-gray-700 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Fetching import history...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-gray-900/20 border border-gray-800 rounded-2xl border-dashed">
        <div className="p-4 bg-gray-800/40 rounded-full mb-4">
          <InformationCircleIcon className="h-10 w-10 text-gray-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-1">No history found</h3>
        <p className="text-gray-500 text-sm max-w-xs text-center">Your bulk import audit logs will appear here. Records are automatically cleared after 48 hours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Metadata Import History</h3>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
          <InformationCircleIcon className="h-3 w-3" />
          Records are cleared every 48 hours
        </span>
      </div>
      <div className="bg-gray-950/50 border border-gray-800 rounded-2xl overflow-hidden border-separate shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/20">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Import Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Progress & Results</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {jobs.map((job) => {
              const processedCount = (job.success_count || 0) + (job.error_count || 0);
              const total = job.total_records || 1;
              const progressPercentage = Math.round((processedCount / total) * 100);

              return (
                <tr key={job.id} className="hover:bg-gray-800/30 transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${job.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                          job.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                            'bg-blue-500/10 text-blue-500'
                        }`}>
                        {job.status === 'completed' ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : job.status === 'failed' ? (
                          <ExclamationCircleIcon className="h-5 w-5" />
                        ) : (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-100 flex items-center gap-2">
                          {job.original_filename ? (
                            <span>{job.original_filename}</span>
                          ) : (
                            <span className="text-gray-500 font-mono font-normal">Import #{job.id.slice(0, 8)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 font-medium">
                            {formatDate(job.created_at)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${job.status === 'completed' ? 'text-green-500/70' :
                              job.status === 'failed' ? 'text-red-500/70' :
                                'text-blue-500/70'
                            }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-2 max-w-[200px] mx-auto">
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden p-[1px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between w-full px-1">
                        <span className="text-[10px] font-bold text-green-500/90">{job.success_count || 0} OK</span>
                        <span className="text-[10px] font-bold text-gray-400">{progressPercentage}%</span>
                        <span className={`text-[10px] font-bold ${(job.error_count || 0) > 0 ? "text-red-400" : "text-gray-600"}`}>
                          {job.error_count || 0} FAIL
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadAudit(job.id)}
                        className="p-2.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                        title="Download Full Audit Report"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                      </button>
                      {(job.error_count || 0) > 0 && (
                        <button
                          onClick={() => handleDownloadRepair(job.id)}
                          className="p-2.5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all border border-transparent hover:border-amber-500/20"
                          title="Download Repair CSV (Failed Rows Only)"
                        >
                          <WrenchScrewdriverIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
