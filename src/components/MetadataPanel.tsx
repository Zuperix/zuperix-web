'use client';

import { useState, useEffect, useCallback } from 'react';
import CustomImage from './CustomImage';
import { apiFetch, BASE_URL } from '@/lib/api';
import { components } from '@/types/api';
import PdfPreview from './PdfPreview';
import ThreeDPreview from './ThreeDPreview';
import { is3D } from '@/lib/format';
import { 
  XMarkIcon, 
  CheckIcon, 
  ArrowPathIcon,
  InformationCircleIcon,
  TagIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  InboxIcon,
  QueueListIcon,
  PencilIcon
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
  asset_live_url: string;
  thumbnail_lg_url?: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  archived: 'Archived'
};

import AssetOrganizationDialog from './AssetOrganizationDialog';
import WorkflowStartDialog from './WorkflowStartDialog';
import AssetWorkflowStatus from './AssetWorkflowStatus';
import { useWorkflows } from '@/hooks/useWorkflows';
import { AssetWorkflow } from '@/types/workflow';
import { PermissionGate } from './PermissionGate';
import { Action } from '@/types/auth';
import { splitFileName, joinFileName } from '@/lib/naming';
import { toast } from 'sonner';
import { MetadataFieldInput } from './metadata/MetadataFieldInput';

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
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<AssetWorkflow | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const { fetchAssetWorkflow } = useWorkflows();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [fieldDefs, currentValues, assetData, workflowData] = await Promise.all([
        apiFetch<Field[]>(`/workspaces/${workspaceId}/metadata/fields`),
        apiFetch<MetadataValue[]>(`/assets/${assetId}/metadata`),
        apiFetch<AssetDetails>(`/assets/${assetId}`),
        fetchAssetWorkflow(assetId).catch(() => null)
      ]);

      setFields(fieldDefs);
      setAsset(assetData);
      setActiveWorkflow(workflowData);

      const valueMap: Record<string, any> = {
        _status: assetData.status,
        _release_date: assetData.release_date ? assetData.release_date.split('T')[0] : '',
        _expiration_date: assetData.expiration_date ? assetData.expiration_date.split('T')[0] : '',
      };
      
      currentValues.forEach((v: MetadataValue) => {
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
      fetchData(); // Refresh to ensure data sync
    } catch (err: any) {
      setError(err.message || 'Failed to save metadata');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const calculateCompletion = () => {
    if (!asset || fields.length === 0) return 0;
    
    // Standard fields: Status, Release Date, Expiration Date
    const standardFields = ['_status', '_release_date', '_expiration_date'];
    const customFields = fields.map(f => f.id);
    const allFields = [...standardFields, ...customFields];
    
    const filledCount = allFields.filter(id => {
      const val = values[id];
      return val !== undefined && val !== null && val !== '';
    }).length;
    
    return Math.round((filledCount / allFields.length) * 100);
  };

  const completionPercent = calculateCompletion();

  const handleStartNameEdit = () => {
    if (activeWorkflow) {
      toast.error('Asset is locked during active workflow');
      return;
    }
    const { basename } = splitFileName(asset?.original_name || '');
    setTempName(basename);
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleSaveNameEdit = async () => {
    const { basename, extension } = splitFileName(asset?.original_name || '');
    
    if (!tempName.trim() || tempName === basename) {
      handleCancelNameEdit();
      return;
    }

    try {
      setIsSavingName(true);
      const newFullName = joinFileName(tempName.trim(), extension);
      await apiFetch(`/assets/${assetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ original_name: newFullName })
      });
      setIsEditingName(false);
      fetchData(); // Refresh to get updated name
      toast.success('Asset renamed successfully');
    } catch (err) {
      toast.error('Failed to rename asset');
    } finally {
      setIsSavingName(false);
    }
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
            {is3D(asset?.mime_type, asset?.original_name) ? (
              <ThreeDPreview 
                src={asset?.asset_live_url || ''} 
                alt={asset?.original_name || ''}
                className="w-full h-full"
              />
            ) : asset?.mime_type === 'application/pdf' ? (
              <PdfPreview 
                src={asset?.asset_live_url || ''} 
                assetId={asset?.id} 
                className="w-full h-full"
              />
            ) : (
              <>
                <CustomImage 
                  src={asset?.thumbnail_lg_url || asset?.asset_live_url!} 
                  fill
                  shimmerWidth={350}
                  shimmerHeight={200}
                  className="object-contain"
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
              </>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Preview</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-gray-500 font-mono break-all text-center">{assetId}</p>
          
          <div className="mt-4">
            <PermissionGate action={Action.Update} subject="Asset" workspaceId={workspaceId}>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setIsOrganizeOpen(true)}
                  disabled={!!activeWorkflow}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700/60 rounded-2xl text-xs font-bold text-white uppercase tracking-widest transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FolderIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400" />
                  Organize
                </button>
                
                {!activeWorkflow ? (
                  <button 
                    onClick={() => setIsWorkflowOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-2xl text-xs font-bold text-blue-400 uppercase tracking-widest transition-all group"
                  >
                    <QueueListIcon className="h-4 w-4" />
                    Start Approval
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-800/60">
                    <AssetWorkflowStatus workflow={activeWorkflow} />
                  </div>
                )}
              </div>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 text-gray-500" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metadata</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{completionPercent}% COMPLETE</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden -mt-2">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <div className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-colors">
                      File Name
                    </label>
                    {!isEditingName && (
                      <button 
                        onClick={handleStartNameEdit}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-all flex items-center gap-1 group/rename"
                      >
                        <PencilIcon className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Rename</span>
                      </button>
                    )}
                  </div>
                  
                  {isEditingName ? (
                    <div className="flex items-center gap-2 bg-blue-500/5 dark:bg-blue-400/5 p-1 px-2 rounded-lg ring-1 ring-blue-500/50 animate-in fade-in duration-200">
                      <input
                        autoFocus
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNameEdit();
                          if (e.key === 'Escape') handleCancelNameEdit();
                        }}
                        onBlur={handleSaveNameEdit}
                        disabled={isSavingName}
                        className="bg-transparent border-none outline-none text-sm font-medium text-gray-200 flex-1 min-w-0"
                        placeholder="Filename"
                      />
                      <span className="text-[11px] font-bold text-gray-500 flex-none px-1">
                        {splitFileName(asset?.original_name || '').extension}
                      </span>
                      {isSavingName && (
                        <ArrowPathIcon className="h-3 w-3 text-blue-400 animate-spin flex-none" />
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={handleStartNameEdit}
                      className="w-full px-3 py-2 text-sm bg-gray-800/20 border border-gray-700/30 rounded-lg text-gray-400 font-medium truncate cursor-pointer hover:bg-gray-800/40 hover:border-gray-700/60 transition-all"
                      title="Click to rename"
                    >
                      {asset?.original_name}
                    </div>
                  )}
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
                    <MetadataFieldInput
                      key={field.id}
                      field={field}
                      value={values[field.id]}
                      onChange={(val) => updateValue(field.id, val)}
                      disabled={saving}
                    />
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
        onSuccess={fetchData}
      />

      <WorkflowStartDialog
        assetId={assetId}
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        onSuccess={fetchData}
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
