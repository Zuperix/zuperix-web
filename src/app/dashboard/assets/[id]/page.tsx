'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  TagIcon,
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
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { useCategories, Category } from '@/hooks/useCategories';
import { useCollections, Collection as CollectionType } from '@/hooks/useCollections';
import { useRef } from 'react';

interface Field {
  id: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
}

interface MetadataValue {
  fieldId: string;
  value: any;
}

type Tab = 'details' | 'file-info' | 'attachments' | 'versions';

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
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [showEmptyFields, setShowEmptyFields] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

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

  // Versioning state
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!activeWorkspace || !assetId) return;
    try {
      setLoading(true);
      setError('');
      
      const assetData = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(assetData);
      setSelectedCategoryIds(assetData.categories?.map((c: any) => c.id) || []);
      setSelectedCollectionIds(assetData.collections?.map((c: any) => c.id) || []);

      const [fieldDefs, currentValues] = await Promise.all([
        apiFetch<Field[]>(`/workspaces/${activeWorkspace.id}/metadata/fields`),
        apiFetch<MetadataValue[]>(`/assets/${assetId}/metadata`)
      ]);

      setFields(fieldDefs);
      const valueMap: Record<string, any> = {};
      currentValues.forEach(v => {
        valueMap[v.fieldId] = v.value;
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

  const handleSaveMetadata = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const entries = Object.entries(values).map(([fieldId, value]) => ({
        fieldId,
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
  const handleUpdateAsset = async (updates: { release_date?: string | null; expiration_date?: string | null }) => {
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
      alert('Failed to delete asset');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
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
      alert('Failed to create category');
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
      alert('Failed to create collection');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tagInput.trim() || !activeWorkspace) return;
    
    setIsAddingTag(true);
    try {
      const tagName = tagInput.trim();
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
      alert('Failed to add tag');
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
      alert('Failed to remove tag');
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
            <h1 className="text-xl font-bold truncate max-w-[600px] leading-tight text-blue-900 dark:text-gray-100">{asset?.original_name || 'Asset Details'}</h1>
          </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Share"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <a
            href={`http://localhost:3000/api/v1/assets/${assetId}/view`}
            download={asset?.original_name}
            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Download"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </a>
          <button 
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleSaveMetadata}
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
              success 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
            } disabled:opacity-50`}
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : success ? <CheckIcon className="h-4 w-4" /> : null}
            {saving ? 'Saving...' : success ? 'Saved' : 'Save Changes'}
          </button>
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

            {/* Versions Section Placeholder */}
            <div className="w-full max-w-4xl mt-12 mb-20 space-y-4">
               <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
                 <ClockIcon className="h-5 w-5 text-gray-400" />
                 Recent activity
               </h3>
               <div className="bg-white dark:bg-[#151720] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
                  <p className="text-xs text-gray-500">History will be displayed here in future updates.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Information Panel */}
        <div className="w-2/5 flex flex-col bg-white dark:bg-[#0a0b10] border-l border-gray-200 dark:border-gray-800 shadow-2xl relative z-10">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 h-14 shrink-0 overflow-x-auto custom-scrollbar">
            {[
              { id: 'details', label: 'Details', icon: InformationCircleIcon },
              { id: 'file-info', label: 'File info', icon: InboxIcon },
              { id: 'attachments', label: 'Attachments', icon: Square3Stack3DIcon },
              { id: 'versions', label: 'Versions', icon: ClockIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-2 h-full text-[10px] font-bold uppercase tracking-wider transition-all relative border-r border-gray-100 dark:border-gray-800/50 ${
                  activeTab === tab.id 
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
            {activeTab === 'details' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center justify-between mb-8 group cursor-pointer" onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                      <InboxIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Asset info</h2>
                  </div>
                  {isDetailsExpanded ? <ChevronUpIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
                </div>

                {isDetailsExpanded && (
                  <div className="space-y-10 animate-in slide-in-from-top-2 duration-200">
                    {/* Categories Integration */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Square3Stack3DIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                           </div>
                           <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Categories</label>
                        </div>
                        <button 
                          onClick={() => setIsManagingCategories(!isManagingCategories)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${isManagingCategories ? 'bg-blue-600 text-white' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                        >
                          {isManagingCategories ? 'Close' : 'Manage'}
                        </button>
                      </div>

                      {/* Selected Categories Display */}
                      {!isManagingCategories && (
                        <div className="flex flex-wrap gap-2">
                           {flattenedCategories.filter(c => selectedCategoryIds.includes(c.id)).length === 0 ? (
                             <span className="text-[10px] text-gray-400 italic">No categories assigned</span>
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
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Assign Categories</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setShowCategoryInput(!showCategoryInput)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <PlusIcon className="h-3 w-3" />
                                New
                              </button>
                              <button 
                                onClick={() => refreshCategories()}
                                className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                              >
                                Refresh
                              </button>
                            </div>
                          </div>

                          {showCategoryInput && (
                            <form onSubmit={handleCreateCategory} className="flex gap-2 p-1">
                              <input 
                                autoFocus
                                className="flex-1 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500/50"
                                placeholder="Category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                              />
                              <button 
                                type="submit"
                                disabled={creatingCategory || !newCategoryName.trim()}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-blue-700"
                              >
                                {creatingCategory ? '...' : 'Add'}
                              </button>
                            </form>
                          )}

                          <div className="max-h-64 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-800 rounded-2xl p-2 bg-gray-50/50 dark:bg-gray-900/40 space-y-1">
                            {flattenedCategories.map(cat => {
                              const isSelected = selectedCategoryIds.includes(cat.id);
                              return (
                                <div 
                                  key={cat.id}
                                  onClick={() => handleToggleCategory(cat.id)}
                                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                      : 'hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {cat.depth > 0 && (
                                      <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-gray-300 dark:text-gray-600'}`} style={{ paddingLeft: `${(cat.depth - 1) * 8}px` }}>
                                        └
                                      </span>
                                    )}
                                    <span className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {cat.name}
                                    </span>
                                  </div>
                                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white animate-in zoom-in-50 duration-200" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                    {/* Collections Integration */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                              <InboxIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                           </div>
                           <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Collections</label>
                        </div>
                        <button 
                          onClick={() => setIsManagingCollections(!isManagingCollections)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${isManagingCollections ? 'bg-indigo-600 text-white' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                        >
                          {isManagingCollections ? 'Close' : 'Manage'}
                        </button>
                      </div>

                      {/* Selected Collections Display */}
                      {!isManagingCollections && (
                        <div className="flex flex-wrap gap-2">
                           {collections.filter(c => selectedCollectionIds.includes(c.id)).length === 0 ? (
                             <span className="text-[10px] text-gray-400 italic">No collections assigned</span>
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
                           <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Assign Collections</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setShowCollectionInput(!showCollectionInput)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                              >
                                <PlusIcon className="h-3 w-3" />
                                New
                              </button>
                              <button 
                                onClick={() => refreshCollections()}
                                className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                              >
                                Refresh
                              </button>
                            </div>
                          </div>

                          {showCollectionInput && (
                            <form onSubmit={handleCreateCollection} className="flex gap-2 p-1">
                              <input 
                                autoFocus
                                className="flex-1 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                                placeholder="Collection name..."
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                              />
                              <button 
                                type="submit"
                                disabled={creatingCollection || !newCollectionName.trim()}
                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-indigo-700"
                              >
                                {creatingCollection ? '...' : 'Create'}
                              </button>
                            </form>
                          )}

                          <div className="max-h-64 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-800 rounded-2xl p-2 bg-gray-50/50 dark:bg-gray-900/40 space-y-1">
                            {collections.length === 0 ? (
                              <div className="py-8 flex flex-col items-center justify-center opacity-50">
                                <InboxIcon className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No collections</p>
                              </div>
                            ) : (
                              collections.map(col => {
                                const isSelected = selectedCollectionIds.includes(col.id);
                                return (
                                  <div 
                                    key={col.id}
                                    onClick={() => handleToggleCollection(col.id)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                        : 'hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                                  >
                                    <span className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {col.name}
                                    </span>
                                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white animate-in zoom-in-50 duration-200" />}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </section>                    <section className="pt-6 border-t border-gray-100 dark:border-gray-800">
                      <div className="space-y-2">
                        {[
                          { id: 'release_date', label: 'Release date', value: asset?.release_date },
                          { id: 'expiration_date', label: 'Expiration date', value: asset?.expiration_date },
                        ].map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 px-1">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.label}</span>
                            <div className="relative group">
                              <input 
                                type="date"
                                id={`input-${item.id}`}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                value={item.value ? new Date(item.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleUpdateAsset({ [item.id]: e.target.value || null })}
                              />
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl group-hover:border-blue-400/50 transition-all min-w-[140px] justify-between">
                                <span className={`text-[11px] font-semibold ${item.value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 italic'}`}>
                                  {item.value ? new Date(item.value).toLocaleDateString() : 'Set date'}
                                </span>
                                <ClockIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Tags Section */}
                    <section className="space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                             <TagIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Tags</label>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {(asset?.tags || []).map((tag: any, i: number) => (
                             <span key={i} className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-[11px] font-semibold border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                               {tag.name}
                               <button 
                                 onClick={() => handleRemoveTag(tag.name)}
                                 className="text-gray-400 hover:text-red-500 transition-colors"
                               >
                                 <XMarkIcon className="h-3 w-3" />
                               </button>
                             </span>
                          ))}
                          
                          <form onSubmit={handleAddTag} className="flex-1 min-w-[120px]">
                            <input 
                              type="text"
                              placeholder="Add tag..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              disabled={isAddingTag}
                              className="w-full px-4 py-2 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] outline-none focus:border-teal-500/50 transition-all shadow-sm"
                            />
                          </form>
                       </div>
                    </section>

                    {/* Color Palette Section */}
                    <section className="space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                             <PhotoIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Color Palette</label>
                       </div>
                       <div className="flex flex-wrap gap-3">
                          {(asset?.color_palette || []).map((color: string, i: number) => (
                             <div 
                               key={i} 
                               className="group relative"
                             >
                               <div 
                                 className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800 shadow-md cursor-help transition-transform hover:scale-125 duration-200"
                                 style={{ backgroundColor: color }}
                               />
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-30 pointer-events-none shadow-xl border border-gray-800">
                                 {color.toUpperCase()}
                               </div>
                             </div>
                          ))}
                          {(!asset?.color_palette || asset.color_palette.length === 0) && (
                            <p className="text-[10px] text-gray-400 italic">No color data available</p>
                          )}
                       </div>
                    </section>

                    {/* Metadata Section */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Metadata</label>
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

                      <div className="space-y-6">
                        {fields
                          .filter(f => showEmptyFields || values[f.id])
                          .map(field => (
                            <div key={field.id} className="space-y-2 group">
                              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 group-focus-within:text-blue-500 uppercase tracking-widest transition-colors">
                                {field.label}
                                {field.isRequired && <span className="text-red-500">*</span>}
                              </label>
                              
                              {field.fieldType === 'text' ? (
                                <textarea
                                  rows={4}
                                  className="w-full px-4 py-3 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm text-gray-900 dark:text-gray-200 outline-none resize-none placeholder-gray-400"
                                  value={values[field.id] || ''}
                                  onChange={(e) => updateValue(field.id, e.target.value)}
                                />
                              ) : (
                                <input
                                  type="text"
                                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm text-gray-900 dark:text-gray-200 outline-none placeholder-gray-400"
                                  value={values[field.id] || ''}
                                  onChange={(e) => updateValue(field.id, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                        
                        {fields.filter(f => showEmptyFields || values[f.id]).length === 0 && (
                           <div className="py-12 bg-gray-50/50 dark:bg-gray-900/20 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-center">
                              <DocumentDuplicateIcon className="h-10 w-10 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">No metadata fields populated.<br/>Enable "Show empty" to add info.</p>
                           </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            )}

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
                    { label: 'Mime type', value: asset?.mime_type },
                    { label: 'Date uploaded', value: asset?.created_at ? new Date(asset.created_at).toLocaleString() : 'N/A' },
                    { label: 'Workspace ID', value: asset?.workspace_id },
                    { label: 'Asset UUID', value: assetId },
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
                        className={`group relative bg-white dark:bg-[#151720] border rounded-2xl p-4 transition-all hover:shadow-xl ${
                          isLatest 
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

function flattenCategories(categories: Category[]): Category[] {
  let result: Category[] = [];
  categories.forEach(cat => {
    result.push(cat);
    if (cat.children) {
      result = result.concat(flattenCategories(cat.children));
    }
  });
  return result;
}
