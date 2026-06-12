'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  IdentificationIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useCategories, Category } from '@/hooks/useCategories';

type Field = { 
  id: string; 
  key: string; 
  label: string; 
  field_type: string; 
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  fieldIds: string[];
};

interface TemplateManagerProps {
  workspaceId: string;
  fields: Field[];
}

export function TemplateManager({ workspaceId, fields }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fieldSearch, setFieldSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const { categories, refresh: refreshCategories } = useCategories();

  // Helper to flatten categories for multiselect
  const flattenCategories = (cats: Category[], depth = 0): (Category & { depth: number })[] => {
    let result: (Category & { depth: number })[] = [];
    cats.forEach(cat => {
      result.push({ ...cat, depth });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, depth + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any[]>(`/workspaces/${workspaceId}/metadata/templates`);
      const normalized = data.map(t => ({
        ...t,
        fieldIds: t.field_ids || t.fieldIds || []
      }));
      setTemplates(normalized);
    } catch (err: any) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Load template into edit state
  const startEditing = (template: Template) => {
    setEditingTemplateId(template.id);
    setName(template.name);
    setDescription(template.description || '');
    setSelectedFields(template.fieldIds || []);
    
    // Find categories already mapped to this template
    const mappedCats = flatCategories
      .filter(c => c.metadata_template_id === template.id)
      .map(c => c.id);
    setSelectedCategories(mappedCats);
    
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTemplateId(null);
    setName('');
    setDescription('');
    setSelectedFields([]);
    setSelectedCategories([]);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let templateId = editingTemplateId;

      if (editingTemplateId) {
        // Update existing template
        await apiFetch(`/workspaces/${workspaceId}/metadata/templates/${editingTemplateId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            description,
            fieldIds: selectedFields,
          }),
        });
      } else {
        // Create new template
        const res = await apiFetch<Template>(`/workspaces/${workspaceId}/metadata/templates`, {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            fieldIds: selectedFields,
          }),
        });
        templateId = res.id;
      }

      // Sync category bindings
      // Categories to unbind
      const originalMappedCats = editingTemplateId 
        ? flatCategories.filter(c => c.metadata_template_id === editingTemplateId).map(c => c.id)
        : [];
      
      const toUnbind = originalMappedCats.filter(cid => !selectedCategories.includes(cid));
      const toBind = selectedCategories.filter(cid => !originalMappedCats.includes(cid));

      await Promise.all([
        ...toUnbind.map(cid => apiFetch(`/categories/${cid}`, {
          method: 'PATCH',
          body: JSON.stringify({ metadata_template_id: null })
        })),
        ...toBind.map(cid => apiFetch(`/categories/${cid}`, {
          method: 'PATCH',
          body: JSON.stringify({ metadata_template_id: templateId })
        }))
      ]);

      setSuccess(`Template ${editingTemplateId ? 'updated' : 'created'} successfully`);
      cancelEdit();
      fetchTemplates();
      refreshCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await apiFetch(`/workspaces/${workspaceId}/metadata/templates/${id}`, {
        method: 'DELETE',
      });
      setSuccess('Template removed');
      fetchTemplates();
      refreshCategories();
    } catch (err: any) {
      setError('Failed to delete template');
    }
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const selectAllFields = () => setSelectedFields(fields.map(f => f.id));
  const clearAllFields = () => setSelectedFields([]);

  const selectAllCategories = () => setSelectedCategories(flatCategories.map(c => c.id));
  const clearAllCategories = () => setSelectedCategories([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-1">
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 sticky top-8">
          <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editingTemplateId ? <PencilSquareIcon className="h-5 w-5 text-amber-400" /> : <PlusIcon className="h-5 w-5 text-blue-400" />}
              {editingTemplateId ? 'Edit Template' : 'New Template'}
            </div>
            {editingTemplateId && (
              <button onClick={cancelEdit} className="p-1 hover:bg-gray-800 rounded-lg">
                <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-400" />
              </button>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Template Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Jio Photography"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Description</label>
              <textarea
                placeholder="Specify intended category uses"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all text-xs"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned Fields ({selectedFields.length})</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={selectAllFields} className="text-[9px] font-bold text-blue-400 hover:underline">All</button>
                  <button type="button" onClick={clearAllFields} className="text-[9px] font-bold text-gray-500 hover:underline">Clear</button>
                </div>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search fields..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all text-xs font-medium"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-800 rounded-xl bg-gray-950 p-2 space-y-1 custom-scrollbar">
                {fields
                  .filter(f => !fieldSearch || f.label.toLowerCase().includes(fieldSearch.toLowerCase()) || f.key.toLowerCase().includes(fieldSearch.toLowerCase()))
                  .map(f => (
                  <label key={f.id} className={`flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer transition-colors ${selectedFields.includes(f.id) ? 'bg-blue-500/5 border border-blue-500/10' : 'border border-transparent'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedFields.includes(f.id)} 
                      onChange={() => toggleField(f.id)}
                      className="rounded border-gray-800 bg-gray-900 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-xs text-gray-300 font-semibold flex-1">{f.label}</span>
                    <span className="px-1.5 py-0.5 bg-gray-800/60 border border-gray-700/40 text-gray-400 text-[8px] font-bold rounded uppercase tracking-wider">
                      {f.field_type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Apply to Categories ({selectedCategories.length})</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={selectAllCategories} className="text-[9px] font-bold text-blue-400 hover:underline">All</button>
                  <button type="button" onClick={clearAllCategories} className="text-[9px] font-bold text-gray-500 hover:underline">Clear</button>
                </div>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Filter categories..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 outline-none transition-all text-xs font-medium"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-800 rounded-xl bg-gray-950 p-2 space-y-1 custom-scrollbar">
                {flatCategories
                  .filter(cat => !categorySearch || cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map(cat => (
                  <label key={cat.id} className={`flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg cursor-pointer transition-colors ${selectedCategories.includes(cat.id) ? 'bg-blue-500/5 border border-blue-500/10' : 'border border-transparent'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat.id)} 
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-gray-800 bg-gray-900 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-xs text-gray-300 font-semibold" style={{ marginLeft: `${cat.depth * 8}px` }}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full ${editingTemplateId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs`}
            >
              {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
              {editingTemplateId ? 'Save Changes' : 'Create Template'}
            </button>
          </form>
        </div>
      </div>

      {/* Templates List */}
      <div className="lg:col-span-2 space-y-6">
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-gray-900/20 border border-gray-800 rounded-2xl border-dashed">
            <ArrowPathIcon className="h-8 w-8 text-gray-700 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl text-gray-500 flex flex-col items-center justify-center gap-2">
            <IdentificationIcon className="h-10 w-10 text-gray-700" />
            <p className="text-sm font-semibold">No metadata templates available</p>
            <p className="text-xs text-gray-600 max-w-xs">Create your first template on the left to start mapping requirements across your categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {templates.map(t => {
              const assignedCount = flatCategories.filter(c => c.metadata_template_id === t.id).length;
              return (
                <div key={t.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:bg-gray-800/40 transition-all group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        {t.name}
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-md">
                          {(t.fieldIds || []).length} fields
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{t.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(t)} 
                        className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                        title="Edit Template"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => deleteTemplate(t.id)} 
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Template"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="font-semibold uppercase tracking-wider">Assigned Categories:</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${assignedCount > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                        {assignedCount} mapping{assignedCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
