'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';
import CommentsSection from '@/components/CommentsSection';
import AssetHistory from '@/components/AssetHistory';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  TagIcon,
  QueueListIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ShareIcon,
  Square3Stack3DIcon,
  ClockIcon,
  InboxIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAltIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import DownloadModal from '@/components/DownloadModal';
import { useCategories, Category } from '@/hooks/useCategories';
import { useCollections, Collection as CollectionType } from '@/hooks/useCollections';
import { PermissionGate } from '@/components/PermissionGate';
import SimilarAssets from '@/components/SimilarAssets';
import { Action } from '@/types/auth';
import { toast } from 'sonner';
import WorkflowStartDialog from '@/components/WorkflowStartDialog';
import AssetWorkflowStatus from '@/components/AssetWorkflowStatus';
import { useWorkflows } from '@/hooks/useWorkflows';
import { AssetWorkflow } from '@/types/workflow';

interface Field {
  id: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
}

interface MetadataValue {
  field_id: string;
  value: any;
}

type Tab = 'file-info' | 'attachments' | 'versions' | 'comments' | 'history' | 'workflow';

const STATUS_STYLING: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending_review: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-500 border-green-500/30',
  archived: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  archived: 'Archived',
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('file-info');
  const [showEmptyFields, setShowEmptyFields] = useState(false);

  // Organization state
  const { categories, refresh: refreshCategories } = useCategories();
  const { collections, refresh: refreshCollections } = useCollections();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showCollectionInput, setShowCollectionInput] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isManagingCollections, setIsManagingCollections] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Versioning state
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeWorkflow, setActiveWorkflow] = useState<AssetWorkflow | null>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const { fetchAssetWorkflow } = useWorkflows();

  const fetchData = useCallback(async () => {
    if (!activeWorkspace || !assetId) return;
    try {
      setLoading(true);
      setError('');

      const assetData = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(assetData);
      setSelectedCategoryIds(assetData.categories?.map((c: any) => c.id) || []);
      setSelectedCollectionIds(assetData.collections?.map((c: any) => c.id) || []);

      const [fieldDefs, currentValues, workflowData] = await Promise.all([
        apiFetch<Field[]>(`/workspaces/${activeWorkspace.id}/metadata/fields`),
        apiFetch<MetadataValue[]>(`/assets/${assetId}/metadata`),
        fetchAssetWorkflow(assetId).catch(() => null)
      ]);

      setFields(fieldDefs);
      setActiveWorkflow(workflowData);
      const valueMap: Record<string, any> = {};
      currentValues.forEach(v => {
        if (v.field_id && v.field_id !== 'undefined') {
          valueMap[v.field_id] = v.value;
        }
      });
      setValues(valueMap);
    } catch (err: any) {
      setError('Failed to load asset details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [assetId, activeWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch all workspace tags for autocomplete
  useEffect(() => {
    const fetchWorkspaceTags = async () => {
      if (!activeWorkspace) return;
      try {
        const tags = await apiFetch<any[]>(`/workspaces/${activeWorkspace.id}/tags`);
        setAvailableTags(tags);
      } catch (err) {
        console.error('Failed to fetch workspace tags', err);
      }
    };
    fetchWorkspaceTags();
  }, [activeWorkspace]);

  // Filter suggestions as user types
  useEffect(() => {
    if (!tagInput.trim()) {
      setFilteredSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    const currentTagNames = (asset?.tags || []).map((t: any) => t.name.toLowerCase());
    const filtered = availableTags.filter(tag => 
      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !currentTagNames.includes(tag.name.toLowerCase())
    );

    setFilteredSuggestions(filtered);
    setShowTagSuggestions(filtered.length > 0);
  }, [tagInput, availableTags, asset?.tags]);

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveMetadata = async () => {
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

      // Update metadata
      await apiFetch(`/assets/${assetId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ entries }),
      });

      // Update organization
      await apiFetch(`/assets/${assetId}/organization`, {
        method: 'PUT',
        body: JSON.stringify({
          category_ids: selectedCategoryIds,
          collection_ids: selectedCollectionIds
        })
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchData(); // Refresh to get updated organization labels
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateAsset = async (updates: { status?: string; release_date?: string | null; expiration_date?: string | null }) => {
    if (!assetId) return;
    try {
      setSaving(true);
      await apiFetch(`/assets/${assetId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      // Refresh asset data
      const updatedAsset = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(updatedAsset);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update asset:', err);
      setError('Failed to update asset details');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await apiFetch(`/assets/${assetId}`, { method: 'DELETE' });
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleToggleCategory = (id: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleToggleCollection = (id: string) => {
    setSelectedCollectionIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const resp = await apiFetch<any>(`/categories`, {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim(), workspace_id: activeWorkspace?.id })
      });
      await refreshCategories();
      setSelectedCategoryIds(prev => [...prev, resp.id]);
      setNewCategoryName('');
      setShowCategoryInput(false);
    } catch (err) {
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const resp = await apiFetch<any>(`/collections`, {
        method: 'POST',
        body: JSON.stringify({ name: newCollectionName.trim(), workspace_id: activeWorkspace?.id })
      });
      await refreshCollections();
      setSelectedCollectionIds(prev => [...prev, resp.id]);
      setNewCollectionName('');
      setShowCollectionInput(false);
    } catch (err) {
      toast.error('Failed to create collection');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleAddTag = async (e?: React.FormEvent, nameOverride?: string) => {
    if (e) e.preventDefault();
    const tagName = (nameOverride || tagInput).trim();
    if (!tagName || !activeWorkspace) return;

    setIsAddingTag(true);
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/assets/${assetId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tags: [tagName] })
      });
      // Refresh asset to get updated tags
      const updatedAsset = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(updatedAsset);
      setTagInput('');
    } catch (err) {
      console.error('Failed to add tag:', err);
      toast.error('Failed to add tag');
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/assets/${assetId}/tags`, {
        method: 'DELETE',
        body: JSON.stringify({ tags: [tagName] })
      });
      // Refresh asset to get updated tags
      const updatedAsset = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(updatedAsset);
    } catch (err) {
      console.error('Failed to remove tag:', err);
      toast.error('Failed to remove tag');
    }
  };

  const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetId) return;

    setIsUploadingVersion(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (versionNotes.trim()) {
        formData.append('notes', versionNotes.trim());
      }

      await apiFetch(`/assets/${assetId}/versions`, {
        method: 'POST',
        body: formData,
      });

      setSuccess(true);
      setVersionNotes('');
      setShowVersionUpload(false);
      setTimeout(() => setSuccess(false), 3000);
      fetchData(); // Refresh to get new version in list
    } catch (err: any) {
      setError(err.message || 'Failed to upload new version');
    } finally {
      setIsUploadingVersion(false);
      if (versionFileInputRef.current) versionFileInputRef.current.value = '';
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!confirm('Are you sure you want to revert to this version? A new version will be created reflecting this state.')) return;

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/assets/${assetId}/versions/${versionId}/revert`, {
        method: 'POST',
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchData(); // Refresh to see the new "reverted" version
    } catch (err: any) {
      setError(err.message || 'Failed to revert version');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fb] dark:bg-[#0f111a] gap-4">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Asset Details</p>
      </div>
    );
  }

  const flattenedCategories = flattenCategories(categories);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0f111a] overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Search Header Bar */}
      <div className="flex items-center px-6 h-12 bg-gray-50 dark:bg-[#1a1c26] border-b border-gray-200 dark:border-gray-800/60 transition-all">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all group"
        >
          <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Search results
        </button>
      </div>

      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0f111a] border-b border-gray-200 dark:border-gray-800/60 sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate max-w-[600px] leading-tight text-blue-900 dark:text-gray-100">{asset?.original_name || 'Asset Details'}</h1>
            {asset?.status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${STATUS_STYLING[asset.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {STATUS_LABELS[asset.status] || asset.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Share"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Download"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          <PermissionGate action={Action.Delete} subject="Asset" workspaceId={activeWorkspace?.id}>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </PermissionGate>
          <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
            <button
              onClick={handleSaveMetadata}
              disabled={saving}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${success
                  ? 'bg-green-500 text-white shadow-green-500/20'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                } disabled:opacity-50`}
            >
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : success ? <CheckIcon className="h-4 w-4" /> : null}
              {saving ? 'Saving...' : success ? 'Saved' : 'Save Changes'}
            </button>
          </PermissionGate>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Preview and Summary */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb] dark:bg-[#090a0f] overflow-y-auto custom-scrollbar">
          <div className="p-8 flex flex-col items-center">
            <div className="relative group w-full max-w-4xl bg-white dark:bg-[#151720] rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 flex items-center justify-center min-h-[400px]">
              {asset?.mime_type?.startsWith('image/') ? (
                <img
                  src={`${BASE_URL}/assets/${assetId}/view`}
                  alt={asset?.original_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-6 p-20">
                  <DocumentIcon className="h-32 w-32 text-gray-300 dark:text-gray-700" />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{asset?.mime_type?.split('/')[1] || 'FILE'}</span>
                </div>
              )}
            </div>

            {/* Quick Summary under Image */}
            <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#151720] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-blue-200 dark:hover:border-blue-900/50">
                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Storage</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Public Assets</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#151720] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50">
                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                  <Square3Stack3DIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Type</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Images</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#151720] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-emerald-200 dark:hover:border-emerald-900/50">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <PhotoIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ratio</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{asset?.aspect_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-4xl mt-12 mb-20 space-y-12">
              {/* Categories & Collections Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4 bg-white dark:bg-[#151720] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Square3Stack3DIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Categories</label>
                    </div>
                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <button
                        onClick={() => setIsManagingCategories(!isManagingCategories)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${isManagingCategories ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                      >
                        {isManagingCategories ? 'Close' : 'Manage'}
                      </button>
                    </PermissionGate>
                  </div>

                  {!isManagingCategories && (
                    <div className="flex flex-wrap gap-2">
                      {flattenedCategories.filter(c => selectedCategoryIds.includes(c.id)).length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No categories assigned</span>
                      ) : (
                        flattenedCategories.filter(c => selectedCategoryIds.includes(c.id)).map(cat => (
                          <span key={cat.id} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1.5">
                            {cat.name}
                            <button onClick={() => handleToggleCategory(cat.id)} className="hover:text-blue-200">
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  {isManagingCategories && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {showCategoryInput ? (
                        <form onSubmit={handleCreateCategory} className="flex gap-2">
                          <input
                            autoFocus
                            className="flex-1 bg-gray-50 dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500/50"
                            placeholder="Category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowCategoryInput(true)}
                          className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold text-gray-400 hover:text-blue-500 hover:border-blue-500/50 transition-all"
                        >
                          + Create New Category
                        </button>
                      )}

                      <div className="max-h-60 overflow-y-auto custom-scrollbar px-1 py-1">
                        {flattenedCategories.map((cat: any) => {
                          const isSelected = selectedCategoryIds.includes(cat.id);
                          const depth = cat.depth || 0;
                          return (
                            <div key={cat.id} className="relative group/item">
                              {depth > 0 && (
                                <div 
                                  className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800 pointer-events-none" 
                                  style={{ marginLeft: `${(depth - 1) * 1.5 + 0.75}rem` }}
                                />
                              )}
                              <div
                                onClick={() => handleToggleCategory(cat.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300'
                                }`}
                                style={{ marginLeft: `${depth * 1.5}rem` }}
                              >
                                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : ''}`}>
                                  {cat.name}
                                </span>
                                {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-4 bg-white dark:bg-[#151720] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <InboxIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Collections</label>
                    </div>
                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <button
                        onClick={() => setIsManagingCollections(!isManagingCollections)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${isManagingCollections ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                      >
                        {isManagingCollections ? 'Close' : 'Manage'}
                      </button>
                    </PermissionGate>
                  </div>

                  {!isManagingCollections && (
                    <div className="flex flex-wrap gap-2">
                      {collections.filter(c => selectedCollectionIds.includes(c.id)).length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No collections assigned</span>
                      ) : (
                        collections.filter(c => selectedCollectionIds.includes(c.id)).map(col => (
                          <span key={col.id} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1.5">
                            {col.name}
                            <button onClick={() => handleToggleCollection(col.id)} className="hover:text-indigo-200">
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  {isManagingCollections && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {showCollectionInput ? (
                        <form onSubmit={handleCreateCollection} className="flex gap-2">
                          <input
                            autoFocus
                            className="flex-1 bg-gray-50 dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500/50"
                            placeholder="Collection name..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={creatingCollection || !newCollectionName.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowCollectionInput(true)}
                          className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold text-gray-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all"
                        >
                          + Create New Collection
                        </button>
                      )}

                      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                        {collections.map(col => {
                          const isSelected = selectedCollectionIds.includes(col.id);
                          return (
                            <div
                              key={col.id}
                              onClick={() => handleToggleCollection(col.id)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}
                            >
                              <span className="text-[11px] font-medium">{col.name}</span>
                              {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Tags & Dates Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4 bg-white dark:bg-[#151720] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                      <TagIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Tags</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(asset?.tags || []).map((tag: any, i: number) => (
                      <span key={i} className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-[11px] font-semibold border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                        {tag.name}
                        <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                          <button onClick={() => handleRemoveTag(tag.name)} className="text-gray-400 hover:text-red-500">
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </PermissionGate>
                      </span>
                    ))}
                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <div className="relative w-full mt-2">
                        <form onSubmit={handleAddTag}>
                          <input
                            ref={tagInputRef}
                            type="text"
                            placeholder="Add tag and press enter..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onFocus={() => {
                              if (filteredSuggestions.length > 0) setShowTagSuggestions(true);
                            }}
                            disabled={isAddingTag}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] outline-none focus:border-teal-500/50"
                          />
                        </form>

                        {showTagSuggestions && (
                          <div 
                            ref={suggestionsRef}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                          >
                            <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                              <div className="px-3 py-1.5 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Suggestions
                              </div>
                              {filteredSuggestions.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    handleAddTag(undefined, tag.name);
                                    setShowTagSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-700 dark:text-gray-300 flex items-center gap-2 group transition-all"
                                >
                                  <TagIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-teal-500" />
                                  <span>{tag.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </PermissionGate>
                  </div>
                </section>

                <section className="space-y-4 bg-white dark:bg-[#151720] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <ClockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Ownership & Dates</label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                      <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                        <div className="relative group">
                          <select
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            value={asset?.status || ''}
                            onChange={(e) => handleUpdateAsset({ status: e.target.value })}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          <div className={`flex items-center gap-3 px-3 py-1.5 border rounded-xl text-[11px] font-bold transition-all ${STATUS_STYLING[asset?.status || ''] || 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'}`}>
                            {STATUS_LABELS[asset?.status || ''] || 'Set status'}
                            <ChevronDownIcon className="h-3.5 w-3.5 opacity-50" />
                          </div>
                        </div>
                      </PermissionGate>
                    </div>
                    {[
                      { id: 'release_date', label: 'Release date', value: asset?.release_date },
                      { id: 'expiration_date', label: 'Expiration date', value: asset?.expiration_date },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                        <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                          <div className="relative group">
                            <input
                              type="date"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              value={item.value ? new Date(item.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleUpdateAsset({ [item.id]: e.target.value || null })}
                            />
                            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] font-semibold">
                              {item.value ? new Date(item.value).toLocaleDateString() : 'Set date'}
                              <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                          </div>
                        </PermissionGate>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Metadata Section */}
              <section className="space-y-6 bg-white dark:bg-[#151720] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <InformationCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Custom Metadata</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Show empty</span>
                    <button
                      onClick={() => setShowEmptyFields(!showEmptyFields)}
                      className={`w-8 h-4 rounded-full transition-all relative ${showEmptyFields ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showEmptyFields ? 'left-[17px]' : 'left-[3px]'}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {fields
                    .filter(f => showEmptyFields || values[f.id])
                    .map(field => (
                      <div key={field.id} className="space-y-2 group">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 group-focus-within:text-blue-500 uppercase tracking-widest transition-colors">
                          {field.label}
                          {field.isRequired && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-500/50 outline-none text-sm"
                          value={values[field.id] || ''}
                          onChange={(e) => updateValue(field.id, e.target.value)}
                        />
                      </div>
                    ))}

                  {fields.filter(f => showEmptyFields || values[f.id]).length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No metadata fields populated</p>
                    </div>
                  )}
                </div>
              </section>

              {/* OCR Text Section */}
              {asset?.ocr_text && (
                <section className="space-y-6 bg-white dark:bg-[#151720] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <DocumentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">AI Extracted Text</label>
                  </div>
                  <div className="p-6 bg-gray-50/50 dark:bg-[#0a0b10]/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                    <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar selection:bg-blue-500/30">
                      {asset.ocr_text}
                    </div>
                  </div>
                </section>
              )}

              {/* Geo Location Section */}
              {asset?.latitude && asset?.longitude && (
                <section className="space-y-6 bg-white dark:bg-[#151720] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <GlobeAltIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Asset Location</label>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-[400px] w-full relative">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${asset.longitude - 0.01},${asset.latitude - 0.01},${asset.longitude + 0.01},${asset.latitude + 0.01}&layer=mapnik&marker=${asset.latitude},${asset.longitude}`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Coordinates: {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}</span>
                    <a 
                      href={`https://www.openstreetmap.org/?mlat=${asset.latitude}&mlon=${asset.longitude}#map=15/${asset.latitude}/${asset.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      View on OpenStreetMap
                    </a>
                  </div>
                </section>
              )}
              
              <SimilarAssets assetId={assetId} />
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Information Panel */}
        <div className="w-2/5 flex flex-col bg-white dark:bg-[#0a0b10] border-l border-gray-200 dark:border-gray-800 shadow-2xl relative z-10">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 h-14 shrink-0 overflow-x-auto custom-scrollbar">
            {[
              { id: 'file-info', label: 'File info', icon: InboxIcon },
              { id: 'workflow', label: 'Workflow', icon: QueueListIcon },
              { id: 'history', label: 'History', icon: ClockIcon },
              { id: 'attachments', label: 'Attachments', icon: Square3Stack3DIcon },
              { id: 'versions', label: 'Versions', icon: ClockIcon },
              { id: 'comments', label: 'Comments', icon: ChatBubbleLeftIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-2 h-full text-[10px] font-bold uppercase tracking-wider transition-all relative border-r border-gray-100 dark:border-gray-800/50 ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 bg-gray-50/50 dark:bg-gray-800/20'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50/30 dark:hover:bg-gray-800/10'
                  }`}
              >
                <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="truncate">{tab.label}</span>
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

            {activeTab === 'file-info' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                    <PhotoIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Technical specifications</h2>
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                  {[
                    { label: 'Original filename', value: asset?.original_name },
                    { label: 'File size', value: asset?.size ? `${(asset.size / 1024 / 1024).toFixed(2)} MB` : '0 MB' },
                    { label: 'Dimensions', value: asset?.width && asset?.height ? `${asset.width} × ${asset.height} px` : 'N/A' },
                    { label: 'Mime type', value: asset?.mime_type },
                    { label: 'Date uploaded', value: asset?.created_at ? new Date(asset.created_at).toLocaleString() : 'N/A' },
                    // { label: 'Workspace ID', value: asset?.workspace_id },
                    // { label: 'Asset UUID', value: assetId },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 break-all">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="flex flex-col items-center justify-center h-64 text-center p-12 animate-in fade-in duration-300">
                <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-3xl mb-6">
                  <InboxIcon className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Coming soon</h3>
                <p className="text-xs text-gray-500 leading-relaxed">This feature is part of our roadmap and will be available in a future update.</p>
              </div>
            )}

            {activeTab === 'versions' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Version history</h2>
                  </div>
                  <button
                    onClick={() => setShowVersionUpload(!showVersionUpload)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    <PlusIcon className="h-4 w-4" />
                    New Version
                  </button>
                </div>

                {showVersionUpload && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <button onClick={() => setShowVersionUpload(false)} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Version notes</label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-500/50 outline-none text-xs transition-all resize-none"
                        placeholder="What changed in this version?"
                        value={versionNotes}
                        onChange={(e) => setVersionNotes(e.target.value)}
                      />
                    </div>
                    <input
                      type="file"
                      ref={versionFileInputRef}
                      className="hidden"
                      onChange={handleUploadNewVersion}
                    />
                    <button
                      onClick={() => versionFileInputRef.current?.click()}
                      disabled={isUploadingVersion}
                      className="w-full py-3 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-xl flex flex-col items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                      {isUploadingVersion ? (
                        <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
                      ) : (
                        <CloudArrowUpIcon className="h-6 w-6 text-blue-400 group-hover:text-blue-600 transition-colors" />
                      )}
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600 uppercase tracking-wider">
                        {isUploadingVersion ? 'Uploading...' : 'Click to select file'}
                      </span>
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {(asset?.versions || []).map((version: any, index: number) => {
                    const isLatest = index === 0;
                    return (
                      <div
                        key={version.id}
                        className={`group relative bg-white dark:bg-[#151720] border rounded-2xl p-4 transition-all hover:shadow-xl ${isLatest
                            ? 'border-blue-500 dark:border-blue-500/50 shadow-blue-500/5'
                            : 'border-gray-100 dark:border-gray-800'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${isLatest ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                              <span className={`text-xs font-bold ${isLatest ? 'text-white' : 'text-gray-400'}`}>
                                v{version.version_number}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {isLatest ? 'Current Version' : `Version ${version.version_number}`}
                                </span>
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-extrabold uppercase rounded tracking-tighter">Active</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 italic">
                                {version.notes || 'No change notes provided.'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {version.created_at ? new Date(version.created_at).toLocaleString() : 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DocumentIcon className="h-3 w-3" />
                                  {(version.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <a
                              href={`${BASE_URL}/assets/${assetId}/versions/${version.id}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="View original"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </a>
                            {!isLatest && (
                              <button
                                onClick={() => handleRevert(version.id)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                title="Revert to this version"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(asset?.versions?.length || 0) === 0 && (
                    <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/20 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                      <ClockIcon className="h-12 w-12 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No version history available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'comments' && (
              <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
                <CommentsSection assetId={assetId} workspaceId={activeWorkspace?.id} />
              </div>
            )}
            {activeTab === 'history' && (
              <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Audit History</h2>
                </div>
                <div className="bg-gray-50/30 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <AssetHistory assetId={assetId} />
                </div>
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                      <QueueListIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Workflow Status</h2>
                  </div>
                  {!activeWorkflow && (
                    <button
                      onClick={() => setIsWorkflowDialogOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Start Workflow
                    </button>
                  )}
                </div>

                {activeWorkflow ? (
                  <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
                    <AssetWorkflowStatus workflow={activeWorkflow} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-full mb-6">
                      <QueueListIcon className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">No Active Workflow</h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-[240px]">This asset is currently not enrolled in any approval process.</p>
                    <button
                      onClick={() => setIsWorkflowDialogOpen(true)}
                      className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                    >
                      Initiate Workflow
                    </button>
                  </div>
                )}

                <WorkflowStartDialog
                  assetId={assetId}
                  isOpen={isWorkflowDialogOpen}
                  onClose={() => setIsWorkflowDialogOpen(false)}
                  onSuccess={() => {
                    fetchData();
                    toast.success('Workflow initiated successfully!');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        assetId={assetId}
        originalName={asset?.original_name || 'asset'}
        width={asset?.width}
        height={asset?.height}
        mimeType={asset?.mime_type || 'application/octet-stream'}
      />
    </div>
  );
}

function ChevronLeftIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function flattenCategories(categories: Category[], depth = 0): any[] {
  let result: any[] = [];
  categories.forEach(cat => {
    result.push({ ...cat, depth });
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children, depth + 1));
    }
  });
  return result;
}
