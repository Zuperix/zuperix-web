'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { components } from '@/types/api';
import { 
  XMarkIcon, 
  CheckIcon, 
  ArrowPathIcon,
  InformationCircleIcon,
  TagIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

type Field = components['schemas']['CreateMetadataFieldDto'] & { id: string };
type MetadataValue = { 
  fieldId: string; 
  value: any;
  field?: Field;
};

type AssetDetails = {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
};

export default function MetadataPanel({ 
  assetId, 
  workspaceId, 
  onClose 
}: { 
  assetId: string; 
  workspaceId: string; 
  onClose: () => void;
}) {
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all field definitions for the workspace
      const fieldDefs = await apiFetch<Field[]>(`/workspaces/${workspaceId}/metadata/fields`);
      setFields(fieldDefs);

      // Fetch current values for this asset
      const currentValues = await apiFetch<MetadataValue[]>(`/assets/${assetId}/metadata`);
      const valueMap: Record<string, any> = {};
      currentValues.forEach(v => {
        valueMap[v.fieldId] = v.value;
      });
      setValues(valueMap);

      // Fetch asset details (hacky way for now since we don't have a single asset GET, 
      // but we can find it in the list or maybe we should add a GET /assets/:id)
      // For now, assume we'll just show the preview if it's an image
    } catch (err: any) {
      setError('Failed to load metadata');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [assetId, workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const entries = Object.entries(values).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));

      await apiFetch(`/assets/${assetId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ entries }),
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save metadata');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const isImage = (mime: string) => mime?.startsWith('image/');

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-[350px] shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Asset Info</h2>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Preview Section */}
        <div className="p-4 bg-gray-950/20 border-b border-gray-800/50">
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 relative group">
            <img 
              src={`http://localhost:3000/api/v1/assets/${assetId}/view`} 
              className="w-full h-full object-contain"
              alt="Asset preview"
              onError={(e) => {
                (e.target as any).style.display = 'none';
                (e.target as any).nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden absolute inset-0 items-center justify-center bg-gray-800">
              <DocumentIcon className="h-12 w-12 text-gray-600" />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Preview</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-gray-500 font-mono break-all text-center">{assetId}</p>
        </div>

        {/* Form Section */}
        <div className="p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
              <p className="text-xs text-gray-500 animate-pulse">Loading metadata...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center gap-2">
                  <XMarkIcon className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="h-4 w-4 text-gray-500" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Properties</h3>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-10 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                    <DocumentDuplicateIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No custom fields defined</p>
                  </div>
                ) : (
                  fields.map(field => (
                    <div key={field.id} className="space-y-2 group">
                      <label className="block text-[10px] font-bold text-gray-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.fieldType === 'string' || field.fieldType === 'url' || field.fieldType === 'email' ? (
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-200 outline-none"
                          value={values[field.id] || ''}
                          onChange={(e) => updateValue(field.id, e.target.value)}
                        />
                      ) : field.fieldType === 'text' ? (
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-200 outline-none resize-none"
                          value={values[field.id] || ''}
                          onChange={(e) => updateValue(field.id, e.target.value)}
                        />
                      ) : field.fieldType === 'boolean' ? (
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={values[field.id] || false}
                              onChange={(e) => updateValue(field.id, e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs text-gray-400 font-medium">Enabled</span>
                        </div>
                      ) : field.fieldType === 'integer' || field.fieldType === 'float' ? (
                        <input
                          type="number"
                          step={field.fieldType === 'float' ? '0.01' : '1'}
                          className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-200 outline-none"
                          value={values[field.id] || ''}
                          onChange={(e) => updateValue(field.id, field.fieldType === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
                        />
                      ) : (
                        <div className="text-[10px] text-gray-600 italic">Unsupported type: {field.fieldType}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-950/50 flex gap-3">
        <button
          onClick={fetchData}
          disabled={loading || saving}
          className="p-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          title="Refresh"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            success 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
          } disabled:opacity-50`}
        >
          {saving ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckIcon className="h-4 w-4" />
          ) : null}
          {saving ? 'Saving...' : success ? 'Updated' : 'Save Changes'}
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  );
}
