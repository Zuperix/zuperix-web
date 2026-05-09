'use client';

import { useState } from 'react';
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import DocumentationLink from '@/components/DocumentationLink';
import GenericConfirmationModal from '@/components/GenericConfirmationModal';

export default function WorkspacesManagementPage() {
  const { workspaces, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Workspaces</h1>
          <p className="text-gray-400">Manage your organization workspaces and their resources.</p>
        </div>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-3">
            <ArrowPathIcon className="h-6 w-6 animate-spin" />
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-4">
            <BuildingOfficeIcon className="h-10 w-10 opacity-20" />
            No workspaces found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
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
              {workspaces.map((ws: any) => (
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
                            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
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
                                <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-500/10">
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
        )}
      </div>

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
