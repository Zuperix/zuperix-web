'use client';

import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

export default function UploadModal({ 
  workspaceId, 
  onClose, 
  onSuccess 
}: { 
  workspaceId: string; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);

      // Using Fetch directly for multipart/form-data with progress is tricky without XHR,
      // but for simplicity we'll use a basic fetch here.
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/v1/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Upload Asset</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              file 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
            }`}
          >
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {file ? file.name : 'Click to select or drag and drop'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Images, Videos, PDFs up to 50MB</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Uploading...' : 'Start Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
