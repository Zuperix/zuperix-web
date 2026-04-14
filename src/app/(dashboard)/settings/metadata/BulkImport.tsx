'use client';

import { useState } from 'react';
import { apiFetch, apiDownload } from '@/lib/api';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface BulkImportProps {
  workspaceId: string;
}

export function BulkImport({ workspaceId }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ jobId: string; status: string; progress?: number; result?: any } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiDownload(`/workspaces/${workspaceId}/metadata/bulk/template`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metadata_template_${workspaceId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
    }
  };

  const handleRefreshStatus = async () => {
    // ... same content is fine, I will restore it correctly now ...
    if (!success?.jobId) return;
    setRefreshing(true);
    try {
      const data = await apiFetch<any>(`/workspaces/${workspaceId}/metadata/bulk/jobs/${success.jobId}`);
      setSuccess({
        jobId: data.id,
        status: data.state,
        progress: data.progress,
        result: data.result,
      });
    } catch (err: any) {
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!success?.jobId) return;
    try {
      const blob = await apiDownload(`/workspaces/${workspaceId}/metadata/bulk/jobs/${success.jobId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_full_${success.jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      toast.error('Failed to download report');
    }
  };

  const handleDownloadRepair = async () => {
    if (!success?.jobId) return;
    try {
      const blob = await apiDownload(`/workspaces/${workspaceId}/metadata/bulk/jobs/${success.jobId}/repair`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repair_metadata_${success.jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      toast.error('Failed to download repair CSV');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Only CSV files are allowed');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await apiFetch<any>(`/workspaces/${workspaceId}/metadata/bulk/csv`, {
        method: 'POST',
        body: formData,
      });

      setSuccess({ jobId: result.job_id, status: 'queued' });
      setFile(null);
      toast.success('Bulk import started');
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
      toast.error(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const isCompleted = success?.status === 'completed';
  const isProcessing = success?.status === 'active' || success?.status === 'queued';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ... Info Box ... */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex gap-4">
        <InformationCircleIcon className="h-6 w-6 text-blue-400 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-blue-100 mb-1">How it works</h4>
          <p className="text-sm text-blue-300/80 leading-relaxed">
            Bulk metadata import allows you to update multiple assets at once using a CSV file. 
            Use the <code className="bg-blue-900/40 px-1 rounded text-blue-200">asset_id</code> or <code className="bg-blue-900/40 px-1 rounded text-blue-200">original_filename</code> columns to identify your assets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Download Template */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 hover:bg-gray-900/60 transition-all group">
          <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <DocumentArrowDownIcon className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">1. Download Template</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Get a CSV file with all your custom metadata fields as column headers.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Download CSV Template
          </button>
        </div>

        {/* Step 2: Upload CSV */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 hover:bg-gray-900/60 transition-all group relative overflow-hidden">
          <div className="h-12 w-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CloudArrowUpIcon className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">2. Upload Metadata</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Upload your completed CSV file. The system will process it in the background.
          </p>
          
          <div className="space-y-4">
            <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all cursor-pointer group/upload">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileChange}
              />
              <CloudArrowUpIcon className="h-8 w-8 text-gray-600 mb-2 group-hover/upload:text-blue-400 transition-colors" />
              <span className="text-sm font-medium text-gray-500 group-hover/upload:text-gray-300">
                {file ? file.name : 'Click to select CSV file'}
              </span>
            </label>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 transition-all"
            >
              {uploading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CloudArrowUpIcon className="h-5 w-5" />}
              {uploading ? 'Processing Import...' : 'Start Import'}
            </button>
          </div>
        </div>
      </div>


      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-300">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-8 bg-gray-900/40 border border-gray-800 rounded-3xl flex flex-col gap-6 animate-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCompleted ? (
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              ) : (
                <ArrowPathIcon className="h-8 w-8 text-blue-400 animate-spin" />
              )}
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {isCompleted ? 'Import Completed' : 'Importing Metadata...'}
                </h3>
              </div>
            </div>
            
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing || isCompleted}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-xl transition-all group"
              title="Refresh Status"
            >
              <ArrowPathIcon className={`h-5 w-5 text-gray-400 group-hover:text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {!isCompleted && (
             <div className="space-y-3">
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                 <span className="text-blue-400">Status: {success.status}</span>
                 <span className="text-gray-500">{success.progress || 0}%</span>
               </div>
               <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-500 transition-all duration-500" 
                   style={{ width: `${success.progress || 0}%` }}
                 />
               </div>
             </div>
          )}

          {isCompleted && success.result && (
            <div className="flex items-center gap-6 py-4 px-6 bg-gray-950/50 border border-gray-800 rounded-2xl animate-in fade-in zoom-in duration-500">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Rows</div>
                <div className="text-xl font-bold text-gray-100 italic">{(success.result.success_count || 0) + (success.result.error_count || 0)}</div>
              </div>
              <div className="h-8 w-px bg-gray-800" />
              <div className="flex-1">
                <div className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest mb-1">Succeeded</div>
                <div className="text-xl font-bold text-green-500">{success.result.success_count || 0}</div>
              </div>
              <div className="h-8 w-px bg-gray-800" />
              <div className="flex-1">
                <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest mb-1">Failed</div>
                <div className="text-xl font-bold text-red-500">{success.result.error_count || 0}</div>
              </div>
            </div>
          )}

          {isCompleted && success.result?.preview?.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Results Preview</div>
              <div className="bg-gray-950/50 border border-gray-800 rounded-xl overflow-hidden border-separate">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID / Filename</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {success.result.preview.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0 border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-3 py-2 text-[11px] font-medium text-gray-300 truncate max-w-[120px]" title={row.original_row?.asset_id || row.original_row?.original_filename}>
                          {row.original_row?.asset_id || row.original_row?.original_filename || 'Unknown'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.processed ? (
                            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-bold">OK</span>
                          ) : (
                            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold">FAIL</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-gray-500 italic max-w-[150px] truncate" title={row.error}>
                          {row.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isCompleted && success.result?.has_details && (
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-bold transition-all border border-gray-700 active:scale-[0.98] text-sm"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-400" />
                  Audit Report
                </button>
                
                {(success.result.error_count || 0) > 0 && (
                  <button
                    onClick={handleDownloadRepair}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl font-bold transition-all border border-amber-500/20 active:scale-[0.98] text-sm"
                  >
                    <WrenchScrewdriverIcon className="h-5 w-5 text-amber-500" />
                    Repair CSV
                  </button>
                )}
              </div>

              <p className="text-[10px] text-center text-gray-600 mt-2 uppercase tracking-tighter">
                Includes status and sanitized error details for all {(success.result.success_count || 0) + (success.result.error_count || 0)} rows
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
