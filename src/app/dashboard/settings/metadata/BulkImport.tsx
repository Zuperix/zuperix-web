'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface BulkImportProps {
  workspaceId: string;
}

export function BulkImport({ workspaceId }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ jobId: string } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/workspaces/${workspaceId}/metadata/bulk/template`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metadata_template_${workspaceId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError('Failed to download template');
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

      // Using fetch directly because apiFetch might not handle FormData correctly depending on its implementation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/workspaces/${workspaceId}/metadata/bulk/csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload CSV');
      }

      setSuccess({ jobId: result.data.job_id });
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
            This ensures your data matches the system's expected keys.
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
            Upload your completed CSV file. The system will process it in the background 
            and update your assets' metadata automatically.
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

      <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 hover:bg-gray-900/60 transition-all group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowPathIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">System Sync</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ensure all asset data is correctly indexed and searchable.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!confirm('This will refresh the entire search index for this workspace. It may take a few minutes for thousands of assets. Continue?')) return;
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/workspaces/${workspaceId}/search/reindex`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                toast.success('Sync started in the background.');
              } catch (err) {
                toast.error('Failed to start sync.');
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 rounded-xl font-bold transition-all"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Sync Search Index
          </button>
        </div>
        <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex gap-4 text-xs text-purple-300/70">
          <InformationCircleIcon className="h-5 w-5 shrink-0" />
          <p>This is recommended after large manual database updates or when you notice search results are out of sync with your metadata.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-300">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl flex flex-col gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3 text-green-400 font-bold">
            <CheckCircleIcon className="h-6 w-6" />
            Bulk Import Started
          </div>
          <p className="text-sm text-green-300/70">
            Your CSV is being processed in the background (Job ID: {success.jobId}). 
            Updates will appear on your assets shortly. Larger files may take a few minutes.
          </p>
          <div className="flex gap-2 text-xs font-mono text-green-500/50">
            <span>Status:</span>
            <span className="uppercase tracking-widest">Queued</span>
          </div>
        </div>
      )}
    </div>
  );
}
