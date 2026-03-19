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
type MetadataValue = { field_id: string; value: any };

type AssetDetails = {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  status: string;
  release_date: string | null;
  expiration_date: string | null;
  ocr_text?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  archived: 'Archived'
};

import AssetOrganizationDialog from './AssetOrganizationDialog';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';

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
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [fieldDefs, currentValues, assetData] = await Promise.all([
        apiFetch<Field[]>(`/workspaces/${workspaceId}/metadata/fields`),
        apiFetch<MetadataValue[]>(`/assets/${assetId}/metadata`),
        apiFetch<AssetDetails>(`/assets/${assetId}`)
      ]);

      setFields(fieldDefs);
      setAsset(assetData);

      const valueMap: Record<string, any> = {
        _status: assetData.status,
        _release_date: assetData.release_date ? assetData.release_date.split('T')[0] : '',
        _expiration_date: assetData.expiration_date ? assetData.expiration_date.split('T')[0] : '',
      };
      
      currentValues.forEach(v => {
        if (v.field_id && v.field_id !== 'undefined') {
          valueMap[v.field_id] = v.value;
        }
      });
      setValues(valueMap);

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
      const entries = Object.entries(values)
        .filter(([key, value]) => key && key !== 'undefined' && value !== undefined && !key.startsWith('_'))
        .map(([fieldId, value]) => ({
          field_id: fieldId,
          value,
        }));

      await Promise.all([
        apiFetch(`/assets/${assetId}/metadata`, {
          method: 'PUT',
          body: JSON.stringify({ entries }),
        }),
        apiFetch(`/assets/${assetId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: values._status,
            release_date: values._release_date || null,
            expiration_date: values._expiration_date || null,
          }),
        })
      ]);
      
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
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                }
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
          
          <div className="mt-4">
            <PermissionGate action={Action.Update} subject="Asset" workspaceId={workspaceId}>
              <button 
                onClick={() => setIsOrganizeOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700/60 rounded-2xl text-xs font-bold text-white uppercase tracking-widest transition-all group"
              >
                <TagIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400" />
                Organize
              </button>
            </PermissionGate>
          </div>
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
                  <ArrowPathIcon className="h-4 w-4 text-gray-500" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lifecycle</h3>
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-bold text-gray-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-200 outline-none appearance-none cursor-pointer"
                    value={values._status || ''}
                    onChange={(e) => updateValue('_status', e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-bold text-gray-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">
                    Release Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-200 outline-none"
                    value={values._release_date || ''}
                    onChange={(e) => updateValue('_release_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-bold text-gray-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-gray-200 outline-none"
                    value={values._expiration_date || ''}
                    onChange={(e) => updateValue('_expiration_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="h-px bg-gray-800/50 my-6" />

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

              {/* OCR Text Section */}
              {asset?.ocr_text && (
                <>
                  <div className="h-px bg-gray-800/50 my-6" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DocumentIcon className="h-4 w-4 text-gray-500" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Extracted Text</h3>
                    </div>
                    <div className="p-3 bg-gray-950/40 border border-gray-800 rounded-xl">
                      <div className="text-[11px] leading-relaxed text-gray-400 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar selection:bg-blue-500/30">
                        {asset.ocr_text}
                      </div>
                    </div>
                  </div>
                </>
              )}
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
        <PermissionGate action={Action.Update} subject="Asset" workspaceId={workspaceId}>
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
        </PermissionGate>
      </div>

      <AssetOrganizationDialog 
        assetId={assetId} 
        isOpen={isOrganizeOpen} 
        onClose={() => setIsOrganizeOpen(false)} 
      />

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
