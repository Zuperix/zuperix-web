'use client';

import { useState } from 'react';
import { XMarkIcon, DocumentDuplicateIcon, CheckIcon, TagIcon, InformationCircleIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
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
  const [linkName, setLinkName] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { categories } = useCategories();
  const { fields: metadataFields } = useMetadataFields(workspaceId);
  const [initialMetadata, setInitialMetadata] = useState<Record<string, any>>({});
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataSearch, setMetadataSearch] = useState('');

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
    if (!linkName.trim()) {
      setErrors({ name: 'Link name is required' });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const payload: any = {
        workspace_id: workspaceId,
        name: linkName.trim(),
        allowed_types: allowedTypes,
        allow_metadata_edit: false, // Force false as per new requirement
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

      const data = await apiFetch<{ token: string }>(`/guest-uploads/links`, {
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
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Link Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Guest Uploads - Campaign June" 
                    value={linkName} 
                    onChange={e => setLinkName(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-sm outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} focus:border-blue-500`}
                    required
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.name}</p>}
                </div>

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

                {/* Predefined Metadata Toggle & Fields */}
                {metadataFields.length > 0 && (
                  <div className="border rounded-2xl dark:border-gray-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowMetadata(!showMetadata)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TagIcon className={`h-4 w-4 ${showMetadata ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Predefined Metadata
                        </span>
                        {Object.keys(initialMetadata).length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded-md">
                            {Object.keys(initialMetadata).length} set
                          </span>
                        )}
                      </div>
                      {showMetadata ? (
                        <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    {showMetadata && (
                      <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {metadataFields.length > 5 && (
                          <div className="relative mb-3">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search metadata fields..."
                              value={metadataSearch}
                              onChange={(e) => setMetadataSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] outline-none"
                            />
                          </div>
                        )}

                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                          {metadataFields
                            .filter(f => !metadataSearch || f.label.toLowerCase().includes(metadataSearch.toLowerCase()) || f.key.toLowerCase().includes(metadataSearch.toLowerCase()))
                            .map((field) => (
                            <div key={field.id} className="space-y-1">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                {field.label}
                              </label>
                              {field.field_type === 'boolean' ? (
                                <div className="flex items-center h-9 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                                  <label className="flex items-center gap-2 cursor-pointer w-full">
                                    <input
                                      type="checkbox"
                                      checked={initialMetadata[field.key] || false}
                                      onChange={(e) => setInitialMetadata(prev => ({ ...prev, [field.key]: e.target.checked }))}
                                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Enabled</span>
                                  </label>
                                </div>
                              ) : (
                                <input
                                  type={field.field_type === 'integer' || field.field_type === 'float' ? 'number' : 'text'}
                                  value={initialMetadata[field.key] || ''}
                                  onChange={(e) => setInitialMetadata(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
                  <div>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5 leading-relaxed">
                      Assets uploaded via this link will automatically be marked as <strong>uploaded by you</strong> in the system library.
                    </p>
                  </div>
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
