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
  LockClosedIcon,
  PencilIcon,
  XMarkIcon,
  TableCellsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import { BulkImport } from './BulkImport';
import { ImportHistory } from './ImportHistory';
import { TemplateManager } from './TemplateManager';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import MetadataSettingsTour from '@/components/MetadataSettingsTour';

type Field = {
  id: string;
  key: string;
  label: string;
  fieldType: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean
};

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
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newField, setNewField] = useState({
    key: '',
    label: '',
    fieldType: 'string' as any,
    is_required: false,
    is_searchable: true,
    is_filterable: true,
  });

  const [activeTab, setActiveTab] = useState<'fields' | 'templates' | 'bulk' | 'history'>('fields');
  const [showReindexWarning, setShowReindexWarning] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      if (editingFieldId) {
        await apiFetch(`/workspaces/${activeWorkspace.id}/metadata/fields/${editingFieldId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            key: newField.key,
            label: newField.label,
            is_required: newField.is_required,
            is_searchable: newField.is_searchable,
            is_filterable: newField.is_filterable,
          }),
        });
        setSuccess('Field updated successfully');
      } else {
        await apiFetch(`/workspaces/${activeWorkspace.id}/metadata/fields`, {
          method: 'POST',
          body: JSON.stringify({
            key: newField.key,
            label: newField.label,
            field_type: newField.fieldType,
            is_required: newField.is_required,
            is_searchable: newField.is_searchable,
            is_filterable: newField.is_filterable,
          }),
        });
        setSuccess('Field created successfully');
      }

      setEditingFieldId(null);
      setNewField({
        key: '',
        label: '',
        fieldType: 'string',
        is_required: false,
        is_searchable: true,
        is_filterable: true,
      });
      setShowReindexWarning(false);
      fetchFields();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingFieldId ? 'update' : 'create'} field`);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (field: Field) => {
    setEditingFieldId(field.id);
    setNewField({
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      is_required: field.is_required,
      is_searchable: field.is_searchable,
      is_filterable: field.is_filterable,
    });
    setShowReindexWarning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setNewField({
      key: '',
      label: '',
      fieldType: 'string',
      is_required: false,
      is_searchable: true,
      is_filterable: true,
    });
    setShowReindexWarning(false);
  };

  const handleDelete = (field: Field) => {
    setFieldToDelete(field);
  };

  const confirmDelete = async () => {
    if (!activeWorkspace || !fieldToDelete) return;

    setIsDeleting(true);
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/metadata/fields/${fieldToDelete.id}`, {
        method: 'DELETE',
      });
      setSuccess('Field deleted');
      setFieldToDelete(null);
      fetchFields();
    } catch (err: any) {
      setError('Failed to delete field');
    } finally {
      setIsDeleting(false);
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
      <MetadataSettingsTour activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <Link
            href="/settings"
            className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 transition-colors group"
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

        <div data-tour="metadata-tabs" className="flex bg-gray-900/40 p-1.5 rounded-2xl border border-gray-800 self-start xl:self-center overflow-x-auto w-full xl:w-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('fields')}
            className={`whitespace-nowrap flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'fields'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <ListBulletIcon className="h-4 w-4" />
            Field Definitions
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`whitespace-nowrap flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <IdentificationIcon className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`whitespace-nowrap flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'bulk'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <TableCellsIcon className="h-4 w-4" />
            Bulk Import
          </button>
          <button
            data-tour="metadata-history-tab"
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <ArrowPathIcon className="h-4 w-4" />
            History
          </button>
        </div>
      </div>

      {activeTab === 'bulk' ? (
        <BulkImport workspaceId={activeWorkspace.id} />
      ) : activeTab === 'history' ? (
        <ImportHistory workspaceId={activeWorkspace.id} />
      ) : activeTab === 'templates' ? (
        <TemplateManager workspaceId={activeWorkspace.id} fields={fields} />
      ) : (
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
              <div data-tour="metadata-fields-form" className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 sticky top-8">
                <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingFieldId ? <PencilIcon className="h-5 w-5 text-amber-400" /> : <PlusIcon className="h-5 w-5 text-blue-400" />}
                    {editingFieldId ? 'Edit Field' : 'New Custom Field'}
                  </div>
                  {editingFieldId && (
                    <button
                      onClick={cancelEdit}
                      className="p-1 hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
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
                      disabled={!!editingFieldId}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                        checked={newField.is_required}
                        onChange={(e) => setNewField(prev => ({ ...prev, is_required: e.target.checked }))}
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:shadow-sm"></div>
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Required Field</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={newField.is_searchable}
                        onChange={(e) => {
                          setNewField(prev => ({ ...prev, is_searchable: e.target.checked }));
                          if (editingFieldId) setShowReindexWarning(true);
                        }}
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:shadow-sm"></div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Include in Full-Text Search</span>
                        <span className="block text-[10px] text-gray-600">Make this field searchable via the main search bar</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={newField.is_filterable}
                        onChange={(e) => {
                          setNewField(prev => ({ ...prev, is_filterable: e.target.checked }));
                          if (editingFieldId) setShowReindexWarning(true);
                        }}
                      />
                      <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:shadow-sm"></div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Show in Sidebar Filters</span>
                        <span className="block text-[10px] text-gray-600">Add as a faceted filter in the search sidebar</span>
                      </div>
                    </label>
                  </div>

                  {showReindexWarning && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-300 text-[10px] leading-relaxed animate-in fade-in slide-in-from-top-1">
                      <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Changing search or filter settings will update all your assets. This might take a moment. Please avoid doing this too often to keep the system running fast.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full mt-4 ${editingFieldId ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'} disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2`}
                  >
                    {submitting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : (editingFieldId ? <CheckCircleIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />)}
                    {submitting ? (editingFieldId ? 'Updating...' : 'Creating...') : (editingFieldId ? 'Update Field' : 'Add Field')}
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
                        <div className="flex items-center flex-wrap gap-y-2 gap-x-3 text-xs">
                          <span className="text-gray-500 font-mono truncate max-w-[120px] sm:max-w-none">{field.key}</span>
                          <div className="h-1 w-1 rounded-full bg-gray-700 hidden sm:block" />
                          <span className={field.is_required ? 'text-amber-500/80 font-medium' : 'text-gray-600'}>
                            {field.is_required ? 'Required' : 'Optional'}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-gray-700 hidden sm:block" />
                          <span className={field.is_searchable ? 'text-blue-400/80 font-medium' : 'text-gray-600'}>
                            {field.is_searchable ? 'Searchable' : 'Hidden'}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-gray-700 hidden sm:block" />
                          <span className={field.is_filterable ? 'text-purple-400/80 font-medium' : 'text-gray-600'}>
                            {field.is_filterable ? 'Filterable' : 'No Filter'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <PermissionGate action={Action.Update} subject="MetadataField" workspaceId={activeWorkspace.id}>
                        <button
                          onClick={() => startEdit(field)}
                          className="p-2.5 text-gray-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Edit Field"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </PermissionGate>

                      <PermissionGate action={Action.Delete} subject="MetadataField" workspaceId={activeWorkspace.id}>
                        <button
                          onClick={() => handleDelete(field)}
                          className="p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Field"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Field"
        message={`Are you sure you want to delete "${fieldToDelete?.label}"? This will remove all associated data from assets.`}
        confirmText="Delete Field"
        isDeleting={isDeleting}
      />
    </div>
  );
}
