'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  BuildingOfficeIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  RectangleStackIcon,
  UsersIcon,
  FolderIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ClockIcon,
  ShieldExclamationIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import DocumentationLink from '@/components/DocumentationLink';
import GenericConfirmationModal from '@/components/GenericConfirmationModal';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFilterItem({ id, item, onToggleVisibility }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getLabel = (key: string) => {
    const filterLabels: Record<string, string> = {
      mime_type: 'File Type',
      status: 'Status',
      orientation: 'Orientation',
      tag_uuids: 'Tags',
      file_extension: 'Extension',
      color_palette: 'Colors',
      aspect_ratio: 'Aspect Ratio',
      created_at: 'Upload Date',
      lifecycle: 'Asset Lifecycle',
      category_paths: 'Categories',
      collection_uuids: 'Collections',
      uploaded_by_id: 'Uploaded by',
      average_rating: 'Rating',
      vault_uuids: 'Asset Vaults',
      person_ids: 'People',
      metadata: 'Metadata Custom Fields'
    };
    return filterLabels[key] || key;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800/10 transition-all select-none ${isDragging ? 'opacity-50 border-blue-500/50' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-300"
          title="Drag to reorder"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        <span className="text-xs font-bold text-gray-200">{getLabel(item.key)}</span>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-[10px] text-gray-500 font-bold uppercase select-none tracking-wider pr-1">Visible</label>
        <div 
          onClick={() => onToggleVisibility(item.key)}
          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
            ${item.visible ? 'bg-blue-600' : 'bg-gray-800'}
          `}
        >
          <span
            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
              ${item.visible ? 'translate-x-3' : 'translate-x-0'}
            `}
          />
        </div>
      </div>
    </div>
  );
}

export default function WorkspacesManagementPage() {
  const { workspaces, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [settings, setSettings] = useState<string[]>([]);
  const [requireDownloadPurpose, setRequireDownloadPurpose] = useState<boolean>(false);
  const [allowedPurposes, setAllowedPurposes] = useState<string[]>([]);
  const [filtersConfig, setFiltersConfig] = useState<Array<{ key: string; visible: boolean }>>([]);
  const [defaultFiltersConfig, setDefaultFiltersConfig] = useState<Array<{ key: string; visible: boolean }>>([]);
  const [fetchingSettings, setFetchingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [settingsWorkspace, setSettingsWorkspace] = useState<any>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'filters'>('lifecycle');


  const fetchSettings = async (workspaceId: string) => {
    try {
      setFetchingSettings(true);
      setSettingsError(false);
      const data = (await apiFetch(`/workspaces/${workspaceId}/settings`)) as any;
      setSettings(Array.isArray(data.disable_download_states) ? data.disable_download_states : []);
      setRequireDownloadPurpose(data.require_download_purpose || false);
      setAllowedPurposes(Array.isArray(data.allowed_purposes) ? data.allowed_purposes : []);
      setFiltersConfig(Array.isArray(data.filters_config) ? data.filters_config : []);
      setDefaultFiltersConfig(Array.isArray(data.default_filters_config) ? data.default_filters_config : []);
    } catch (err) {
      setSettingsError(true);
    } finally {
      setFetchingSettings(false);
    }
  };


  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtersConfig.findIndex(item => item.key === active.id);
    const newIndex = filtersConfig.findIndex(item => item.key === over.id);

    const updated = arrayMove(filtersConfig, oldIndex, newIndex);
    setFiltersConfig(updated);
  };

  const handleToggleFilterVisibility = (key: string) => {
    const updated = filtersConfig.map(f => f.key === key ? { ...f, visible: !f.visible } : f);
    setFiltersConfig(updated);
  };


  useEffect(() => {
    if (activeWorkspace) {
      setSettingsWorkspace(activeWorkspace);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (settingsWorkspace?.id) {
      fetchSettings(settingsWorkspace.id);
    }
  }, [settingsWorkspace?.id]);

  const handleToggleSetting = (stateKey: string) => {
    if (!settingsWorkspace?.id) return;
    const newSettings = settings.includes(stateKey)
      ? settings.filter(s => s !== stateKey)
      : [...settings, stateKey];
    
    setSettings(newSettings);
  };

  const handleSaveChanges = async () => {
    if (!settingsWorkspace?.id) return;
    try {
      setSavingSettings(true);
      await apiFetch(`/workspaces/${settingsWorkspace.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          disable_download_states: settings,
          require_download_purpose: requireDownloadPurpose,
          allowed_purposes: allowedPurposes,
          filters_config: filtersConfig,
        }),
      });
      toast.success('Workspace settings saved successfully');
      setIsSettingsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save workspace settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // 1. Filter workspaces by search query
  const filteredWorkspaces = workspaces.filter((ws: any) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Sort workspaces so active/current workspace is always on top
  const sortedWorkspaces = [...filteredWorkspaces].sort((a: any, b: any) => {
    if (a.id === activeWorkspace?.id) return -1;
    if (b.id === activeWorkspace?.id) return 1;
    return 0;
  });

  // 3. Paginate workspaces (10 per page)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedWorkspaces.length / itemsPerPage);
  const paginatedWorkspaces = sortedWorkspaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStartEdit = (ws: any) => {
    setEditingId(ws.id);
    setEditName(ws.name);
  };

  const handleSaveName = async (id: string) => {
    if (!editName || editName === workspaces.find(w => w.id === id)?.name) {
      setEditingId(null);
      return;
    }

    try {
      setSaving(true);
      await apiFetch(`/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName }),
      });
      await refreshWorkspaces();
      toast.success('Workspace name updated');
    } catch (err) {
      toast.error('Failed to update workspace name');
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    try {
      setDeleting(true);
      await apiFetch(`/workspaces/${workspaceToDelete.id}`, {
        method: 'DELETE',
      });
      await refreshWorkspaces();
      toast.success('Workspace deleted successfully');
      setIsDeleteModalOpen(false);
      setWorkspaceToDelete(null);
    } catch (err) {
      toast.error('Failed to delete workspace');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Workspaces</h1>
          <p className="text-gray-400">Manage your organization workspaces and their resources.</p>
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-950/60 border border-gray-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-gray-200 text-sm outline-none transition-all"
          />
          <MagnifyingGlassIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-3">
            <ArrowPathIcon className="h-6 w-6 animate-spin animate-infinite duration-1000" />
            Loading workspaces...
          </div>
        ) : sortedWorkspaces.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-4">
            <BuildingOfficeIcon className="h-10 w-10 opacity-20" />
            No workspaces found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center"></th>
                    <th className="px-6 py-4">Workspace Name</th>
                    <th className="px-6 py-4 text-center">Assets</th>
                    <th className="px-6 py-4 text-center">Members</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedWorkspaces.map((ws: any) => (
                    <tr key={ws.id} className="group hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs transition-all shadow-inner
                          ${activeWorkspace?.id === ws.id ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-gray-800 text-gray-500'}
                        `}>
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {editingId === ws.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName(ws.id)}
                                className="bg-gray-950 border border-blue-500/50 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                              />
                              <button 
                                onClick={() => handleSaveName(ws.id)} 
                                disabled={saving}
                                className="p-1.5 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors"
                              >
                                {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin animate-infinite duration-1000" /> : <CheckIcon className="h-4 w-4" />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors">
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/name">
                              <div className="flex flex-col">
                                <span className="text-gray-200 font-bold flex items-center gap-2">
                                  {ws.name}
                                  {activeWorkspace?.id === ws.id && (
                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-500/10 animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleStartEdit(ws)}
                                className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 text-gray-500 hover:text-blue-400"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                          <RectangleStackIcon className="h-4 w-4 opacity-30" />
                          {ws.asset_count?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                          <UsersIcon className="h-4 w-4 opacity-30" />
                          {ws.member_count?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSettingsWorkspace(ws);
                              setActiveTab('lifecycle');
                              setIsSettingsModalOpen(true);
                            }}

                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                            title="Configure Download Lifecycles"
                          >
                            <Cog6ToothIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setWorkspaceToDelete(ws);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete Workspace"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {sortedWorkspaces.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-950/30 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <span className="text-gray-300 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="text-gray-300 font-bold">
                    {Math.min(currentPage * itemsPerPage, sortedWorkspaces.length)}
                  </span>{' '}
                  of <span className="text-gray-300 font-bold">{sortedWorkspaces.length}</span> workspaces
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3.5 py-1.5 bg-gray-800 border border-gray-700/50 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" /> Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3.5 py-1.5 bg-gray-800 border border-gray-700/50 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  >
                    Next <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>



      {/* Floating Settings Modal */}
      {isSettingsModalOpen && settingsWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />
            
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('lifecycle')}
                  className={`text-lg font-bold pb-2 transition-all relative ${activeTab === 'lifecycle' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Asset Lifecycle Settings
                  {activeTab === 'lifecycle' && <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('filters')}
                  className={`text-lg font-bold pb-2 transition-all relative ${activeTab === 'filters' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Sidebar Filters
                  {activeTab === 'filters' && <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
                </button>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {fetchingSettings ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-500 animate-infinite duration-1000" />
                <span>Loading workspace settings...</span>
              </div>
            ) : settingsError ? (
              <div className="py-12 text-center text-red-400 text-sm">
                ⚠️ Failed to load settings. Make sure you are an administrator.
              </div>
            ) : (
              <>
                {activeTab === 'lifecycle' ? (
                  <>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3.5 mb-6 flex items-start gap-3">
                      <InformationCircleIcon className="h-4.5 w-4.5 text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-300 leading-relaxed">
                        <strong>Bypass Rules:</strong> System administrators and workspace managers (Admins) automatically bypass lifecycle download restrictions. These policies strictly apply to regular contributors, consumer members, and guest download workflows.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[35vh] overflow-y-auto pr-1">
                      {[
                        {
                          id: 'draft',
                          title: 'Draft Assets',
                          desc: 'Disable downloads for assets in the Draft state.',
                          icon: PencilSquareIcon,
                        },
                        {
                          id: 'non-approved',
                          title: 'Non-Approved Assets',
                          desc: 'Restrict downloads for any assets pending approval or archived.',
                          icon: ClockIcon,
                        },
                        {
                          id: 'expired',
                          title: 'Expired Assets',
                          desc: 'Gate downloads automatically once the asset expiration date passes.',
                          icon: ShieldExclamationIcon,
                        },
                        {
                          id: 'unreleased',
                          title: 'Unreleased Assets',
                          desc: 'Prevent downloads of assets before their designated release date.',
                          icon: CalendarIcon,
                        },
                      ].map((option) => {
                        const isChecked = settings.includes(option.id);
                        const Icon = option.icon;
                        return (
                          <div
                            key={option.id}
                            onClick={() => !savingSettings && handleToggleSetting(option.id)}
                            className={`group relative flex items-start justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none
                              ${isChecked 
                                ? 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50 shadow-md shadow-blue-500/5' 
                                : 'bg-gray-950/40 border-gray-800/80 hover:border-gray-700/80 hover:bg-gray-800/10'
                              }
                            `}
                          >
                            <div className="flex gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300
                                ${isChecked ? 'bg-blue-500/10 scale-105' : 'bg-gray-800 group-hover:bg-gray-700'}
                              `}>
                                <Icon className={`h-4 w-4 ${isChecked ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
                              </div>
                              <div className="flex flex-col pr-3">
                                <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors">
                                  {option.title}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                                  {option.desc}
                                </span>
                              </div>
                            </div>
                            
                            <div className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1
                              ${isChecked ? 'bg-blue-600' : 'bg-gray-800'}
                            `}>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                  ${isChecked ? 'translate-x-3' : 'translate-x-0'}
                                `}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-800 pt-6 mt-6">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                        <ShieldCheckIcon className="h-4.5 w-4.5 text-blue-500" />
                        Download Auditing & Compliance
                      </h3>
                      
                      <div 
                        onClick={() => {
                          if (savingSettings) return;
                          setRequireDownloadPurpose(!requireDownloadPurpose);
                        }}
                        className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 select-none
                          ${requireDownloadPurpose 
                            ? 'bg-blue-950/20 border-blue-500/30 shadow-md shadow-blue-500/5' 
                            : 'bg-gray-950/40 border-gray-800/80 hover:border-gray-700/80 hover:bg-gray-800/10'
                          }
                        `}
                      >
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300
                            ${requireDownloadPurpose ? 'bg-blue-500/10 scale-105' : 'bg-gray-800'}
                          `}>
                            <ClipboardDocumentCheckIcon className={`h-4 w-4 ${requireDownloadPurpose ? 'text-blue-400' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex flex-col pr-3">
                            <span className="text-xs font-bold text-gray-200">Require Purpose for Downloads</span>
                            <span className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                              Force users to specify their usage purpose before downloading or sharing assets.
                            </span>
                          </div>
                        </div>
                        
                        <div className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1
                          ${requireDownloadPurpose ? 'bg-blue-600' : 'bg-gray-800'}
                        `}>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                              ${requireDownloadPurpose ? 'translate-x-3' : 'translate-x-0'}
                            `}
                          />
                        </div>
                      </div>

                      {requireDownloadPurpose && (
                        <div className="mt-4 bg-gray-950/45 border border-gray-800/60 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200 max-h-[25vh] overflow-y-auto">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                            Allowed Purposes Options
                          </label>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {allowedPurposes.map((purpose) => (
                              <span 
                                key={purpose} 
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-850 text-gray-300 rounded-lg text-[10px] font-bold border border-gray-800"
                              >
                                {purpose}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newPurposes = allowedPurposes.filter(p => p !== purpose);
                                    setAllowedPurposes(newPurposes);
                                  }}
                                  className="text-gray-500 hover:text-red-400 transition-colors ml-1 font-black"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {allowedPurposes.length === 0 && (
                              <span className="text-[10px] text-gray-500 italic">No custom purposes. "Others" will be the only option.</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g., Marketing Campaign, Internal Design"
                              id="new-purpose-input"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const input = e.currentTarget;
                                  const val = input.value.trim();
                                  if (!val) return;
                                  if (allowedPurposes.includes(val)) {
                                    toast.error('Purpose already exists');
                                    return;
                                  }
                                  setAllowedPurposes([...allowedPurposes, val]);
                                  input.value = '';
                                }
                              }}
                              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-gray-200 text-xs outline-none focus:border-blue-500/50"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const input = document.getElementById('new-purpose-input') as HTMLInputElement;
                                const val = input?.value.trim();
                                if (!val) return;
                                if (allowedPurposes.includes(val)) {
                                  toast.error('Purpose already exists');
                                  return;
                                }
                                setAllowedPurposes([...allowedPurposes, val]);
                                if (input) input.value = '';
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-[9px] text-gray-500 mt-1">Press Enter or click Add to add to allowed purposes list.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3.5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <InformationCircleIcon className="h-4.5 w-4.5 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-blue-300 leading-relaxed">
                          <strong>Sidebar Filter Configuration:</strong> Drag and drop filter blocks below to customize their display order in the assets search sidebar. Toggle visibility to show/hide specific filter options. Metadata Custom Fields are kept grouped together.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiltersConfig(defaultFiltersConfig)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-bold transition-all shrink-0"
                      >
                        Reset to Default
                      </button>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3">
                      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={filtersConfig.map(f => f.key)} strategy={verticalListSortingStrategy}>
                          {filtersConfig.map(item => (
                            <SortableFilterItem
                              key={item.key}
                              id={item.key}
                              item={item}
                              onToggleVisibility={handleToggleFilterVisibility}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end gap-3">
                  <button
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-5 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={savingSettings}
                    onClick={handleSaveChanges}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    {savingSettings && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      <DocumentationLink href="https://docs.zuperix.com/docs/admin/workspaces" />

      {/* Delete Confirmation */}
      <GenericConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setWorkspaceToDelete(null);
        }}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace?"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? All assets and data will be marked for removal.`}
        confirmText="Yes, Delete Workspace"
        requiredConfirmText="DELETE"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
