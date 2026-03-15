'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { components } from '@/types/api';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

type Field = components['schemas']['CreateMetadataFieldDto'] & { id: string };
type MetadataValue = { 
  fieldId: string; 
  value: any;
  field?: Field;
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l dark:border-gray-800 w-80 shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <h2 className="text-lg font-bold dark:text-white">Metadata</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
            
            {fields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No metadata fields defined</p>
            ) : (
              fields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {field.label}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.fieldType === 'string' || field.fieldType === 'url' || field.fieldType === 'email' ? (
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={values[field.id] || ''}
                      onChange={(e) => updateValue(field.id, e.target.value)}
                    />
                  ) : field.fieldType === 'text' ? (
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={values[field.id] || ''}
                      onChange={(e) => updateValue(field.id, e.target.value)}
                    />
                  ) : field.fieldType === 'boolean' ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={values[field.id] || false}
                        onChange={(e) => updateValue(field.id, e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Yes / No</span>
                    </div>
                  ) : field.fieldType === 'integer' || field.fieldType === 'float' ? (
                    <input
                      type="number"
                      step={field.fieldType === 'float' ? '0.01' : '1'}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={values[field.id] || ''}
                      onChange={(e) => updateValue(field.id, field.fieldType === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
                    />
                  ) : (
                    <div className="text-xs text-gray-400 italic">Unsupported field type: {field.fieldType}</div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t dark:border-gray-800">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className={`w-full py-2.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center ${
            success ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {saving ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
          ) : success ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : null}
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save Metadata'}
        </button>
      </div>
    </div>
  );
}
