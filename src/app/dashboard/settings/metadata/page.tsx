'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { components } from '@/types/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  IdentificationIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';

type Field = components['schemas']['CreateMetadataFieldDto'] & { id: string };

const FIELD_TYPES = [
  { value: 'string', label: 'Short Text' },
  { value: 'text', label: 'Long Text' },
  { value: 'integer', label: 'Number (Integer)' },
  { value: 'float', label: 'Number (Decimal)' },
  { value: 'boolean', label: 'Checkbox / Toggle' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
];

export default function MetadataManagementPage() {
  const { activeWorkspace } = useWorkspace();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [newField, setNewField] = useState({
    key: '',
    label: '',
    fieldType: 'string' as any,
    isRequired: false,
    isSearchable: true,
  });

  const fetchFields = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const data = await apiFetch<Field[]>(`/workspaces/${activeWorkspace.id}/metadata/fields`);
      setFields(data);
    } catch (err: any) {
      setError('Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/metadata/fields`, {
        method: 'POST',
        body: JSON.stringify(newField),
      });
      
      setSuccess('Field created successfully');
      setNewField({
        key: '',
        label: '',
        fieldType: 'string',
        isRequired: false,
        isSearchable: true,
      });
      fetchFields();
    } catch (err: any) {
      setError(err.message || 'Failed to create field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!activeWorkspace || !confirm('Are you sure you want to delete this field? This will remove all associated data from assets.')) return;
    
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/metadata/fields/${fieldId}`, {
        method: 'DELETE',
      });
      setSuccess('Field deleted');
      fetchFields();
    } catch (err: any) {
      setError('Failed to delete field');
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-gray-400">Loading workspace context...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link 
            href="/dashboard/settings" 
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-blue-400 uppercase tracking-widest mb-3 transition-colors group"
          >
            <ChevronLeftIcon className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <IdentificationIcon className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Metadata Management</h1>
          </div>
          <p className="text-gray-400 mt-2 text-sm">Define custom properties to store alongside your digital assets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <PermissionGate 
            action={Action.Create} 
            subject="MetadataField" 
            workspaceId={activeWorkspace.id}
            fallback={
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 sticky top-8 flex flex-col items-center justify-center text-center gap-4">
                <LockClosedIcon className="h-10 w-10 text-gray-700" />
                <p className="text-gray-500 text-sm font-medium">You don't have permission to create metadata fields.</p>
              </div>
            }
          >
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
                <PlusIcon className="h-5 w-5 text-blue-400" />
                New Custom Field
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photographer Name"
                    className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all"
                    value={newField.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      setNewField(prev => ({ ...prev, label, key }));
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Key (Internal)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. photographer_name"
                    className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-400 font-mono text-xs outline-none transition-all"
                    value={newField.key}
                    onChange={(e) => setNewField(prev => ({ ...prev, key: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Field Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all appearance-none cursor-pointer"
                    value={newField.fieldType}
                    onChange={(e) => setNewField(prev => ({ ...prev, fieldType: e.target.value }))}
                  >
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value} className="bg-gray-950">{t.label}</option>)}
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newField.isRequired}
                      onChange={(e) => setNewField(prev => ({ ...prev, isRequired: e.target.checked }))}
                    />
                    <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:shadow-sm"></div>
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Required Field</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newField.isSearchable}
                      onChange={(e) => setNewField(prev => ({ ...prev, isSearchable: e.target.checked }))}
                    />
                    <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:shadow-sm"></div>
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Searchable</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                  {submitting ? 'Creating...' : 'Add Field'}
                </button>
              </form>
            </div>
          </PermissionGate>
        </div>

        {/* Fields List */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-300">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm animate-in slide-in-from-top duration-300">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-900/20 border border-gray-800 rounded-2xl border-dashed">
              <ArrowPathIcon className="h-8 w-8 text-gray-700 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Fetching field definitions...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-900/20 border border-gray-800 rounded-2xl border-dashed">
              <div className="p-4 bg-gray-800/40 rounded-full mb-4">
                <IdentificationIcon className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-1">No custom fields yet</h3>
              <p className="text-gray-500 text-sm max-w-xs text-center">Create your first metadata field using the form on the left to start organizing your assets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {fields.map(field => (
                <div 
                  key={field.id} 
                  className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:bg-gray-800/50 hover:border-gray-700 transition-all duration-300 group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl">
                      <IdentificationIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-200 group-hover:text-white transition-colors">{field.label}</h4>
                        <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {field.fieldType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500 font-mono">{field.key}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-700" />
                        <span className={field.isRequired ? 'text-amber-500/80 font-medium' : 'text-gray-600'}>
                          {field.isRequired ? 'Required' : 'Optional'}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-gray-700" />
                        <span className={field.isSearchable ? 'text-blue-400/80 font-medium' : 'text-gray-600'}>
                          {field.isSearchable ? 'Searchable' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <PermissionGate action={Action.Delete} subject="MetadataField" workspaceId={activeWorkspace.id}>
                    <button 
                      onClick={() => handleDelete(field.id)}
                      className="p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Field"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </PermissionGate>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
