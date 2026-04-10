'use client';

import { useState } from 'react';
import { XMarkIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useCategories } from '@/hooks/useCategories';
import { useMetadataFields } from '@/hooks/useMetadataFields';

export default function GuestUploadLinkDialog({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [maxUploads, setMaxUploads] = useState<number | ''>('');
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number | ''>('');
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['all']);
  const [categoryId, setCategoryId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [allowMetadataEdit, setAllowMetadataEdit] = useState<boolean>(false);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  
  const { categories } = useCategories();
  const { fields: metadataFields } = useMetadataFields(workspaceId);
  const [initialMetadata, setInitialMetadata] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const typeOptions = [
    { value: 'all', label: 'All files' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'application/pdf', label: 'PDFs' },
  ];

  const handleTypeSelect = (val: string) => {
    if (val === 'all') {
      setAllowedTypes(['all']);
    } else {
      setAllowedTypes(prev => {
        const withoutAll = prev.filter(p => p !== 'all');
        if (withoutAll.includes(val)) return withoutAll.filter(p => p !== val).length === 0 ? ['all'] : withoutAll.filter(p => p !== val);
        return [...withoutAll, val];
      });
    }
  };

  const flattenCategories = (cats: any[], depth = 0): any[] => {
    let result: any[] = [];
    cats.forEach(cat => {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children?.length > 0) result = result.concat(flattenCategories(cat.children, depth + 1));
    });
    return result;
  };
  const flatCategories = flattenCategories(categories);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload: any = {
        workspace_id: workspaceId,
        allowed_types: allowedTypes,
        allow_metadata_edit: allowMetadataEdit,
      };

      if (maxUploads) payload.max_uploads = maxUploads;
      if (maxFileSizeMB) payload.max_file_size = maxFileSizeMB * 1024 * 1024;
      if (categoryId) payload.category_id = categoryId;
      if (tagsInput) payload.tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      if (Object.keys(initialMetadata).length > 0) payload.metadata = initialMetadata;
      if (expiresInDays) {
        const d = new Date();
        d.setDate(d.getDate() + Number(expiresInDays));
        payload.expires_at = d.toISOString();
      }

      const data = await apiFetch(`/guest-uploads/links`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const publicUrl = `${window.location.origin}/guest-uploads/${data.token}`;
      setGeneratedLink(publicUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white">Generate Public Upload Link</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
          {generatedLink ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <CheckIcon className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-300">Link Generated Successfully</p>
              
              <div className="w-full flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <input 
                  readOnly 
                  value={generatedLink} 
                  className="flex-1 bg-transparent border-none text-xs text-gray-600 dark:text-gray-300 px-3 outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-xs font-semibold shadow-sm border border-gray-200 dark:border-gray-600 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <DocumentDuplicateIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Settings Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Max Uploads</label>
                    <input 
                      type="number" 
                      placeholder="Unlimited" 
                      value={maxUploads} 
                      onChange={e => setMaxUploads(Number(e.target.value) || '')}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Expires In (Days)</label>
                    <input 
                      type="number" 
                      placeholder="Never" 
                      value={expiresInDays} 
                      onChange={e => setExpiresInDays(Number(e.target.value) || '')}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Max File Size (MB)</label>
                  <input 
                    type="number" 
                    placeholder="System Default (500MB)" 
                    value={maxFileSizeMB} 
                    onChange={e => setMaxFileSizeMB(Number(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Allowed Types</label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleTypeSelect(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          allowedTypes.includes(opt.value) || (allowedTypes.includes('all') && opt.value !== 'all')
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-transparent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Predefined Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">None (Global default)</option>
                    {flatCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'\u00A0'.repeat(cat.depth * 2)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Predefined Tags</label>
                  <input 
                    type="text" 
                    placeholder="e.g. guest_upload, campaign_2026" 
                    value={tagsInput} 
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="allowMeta"
                    checked={allowMetadataEdit}
                    onChange={(e) => setAllowMetadataEdit(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <label htmlFor="allowMeta" className="text-sm text-gray-700 dark:text-gray-300">Allow guests to submit metadata</label>
                </div>

              </div>
            </>
          )}
        </div>

        {!generatedLink && (
          <div className="p-6 border-t dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
