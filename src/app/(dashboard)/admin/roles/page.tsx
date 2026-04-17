'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  TrashIcon, 
  CheckIcon, 
  KeyIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { toast } from 'sonner';

interface Permission {
  id: string;
  action: string;
  subject: string;
}

interface Role {
  id: string;
  name: string;
  type: 'SYSTEM' | 'WORKSPACE';
  isSystem: boolean;
  customerId?: string;
  permissions?: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', type: 'WORKSPACE' as 'WORKSPACE' | 'SYSTEM', permissionIds: [] as string[] });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const fetchData = async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        apiFetch<Role[]>('/roles'),
        apiFetch<Permission[]>('/permissions'),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRole) {
        await apiFetch(`/roles/${editingRole.id}`, {
          method: 'PATCH',
          body: JSON.stringify(newRole),
        });
        toast.success('Role updated successfully');
      } else {
        await apiFetch('/roles', {
          method: 'POST',
          body: JSON.stringify(newRole),
        });
        toast.success('Role created successfully');
      }
      setShowCreate(false);
      setEditingRole(null);
      setNewRole({ name: '', type: 'WORKSPACE', permissionIds: [] });
      fetchData();
    } catch (error) {
      console.error('Failed to save role:', error);
      toast.error('Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRequest = (role: Role) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      type: role.type,
      permissionIds: role.permissions?.map(p => p.id) || []
    });
    setShowCreate(true);
  };

  const togglePermission = (id: string) => {
    setNewRole(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(pid => pid !== id)
        : [...prev.permissionIds, id]
    }));
  };

  const handleDeleteRoleRequest = (id: string) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    try {
      await apiFetch(`/roles/${roleToDelete}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
      fetchData();
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error('Failed to delete role');
    } finally {
      setIsDeletingRole(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Role Management</h1>
            <p className="text-sm text-gray-500">Manage system-wide and workspace-specific roles and permissions.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setNewRole({ name: '', type: 'WORKSPACE', permissionIds: [] });
            setShowCreate(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <PlusIcon className="h-4 w-4" />
          Create Role
        </button>
      </div>

      <div className="flex items-center gap-8 border-b border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'roles' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Role Management
          {activeTab === 'roles' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'permissions' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Permissions List
          {activeTab === 'permissions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <form onSubmit={handleCreateRole} className="flex flex-col h-full overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0 bg-gray-900 z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">{editingRole ? 'Edit Role' : 'New Role'}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingRole ? `Update permissions for ${editingRole.name}` : 'Define properties and permissions for the new access role.'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <PlusIcon className="h-5 w-5 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role Name</label>
                    <input
                      type="text"
                      required
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="e.g. Asset Reviewer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type</label>
                    <select
                      value={newRole.type}
                      onChange={(e) => setNewRole({ ...newRole, type: e.target.value as any })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="WORKSPACE">Workspace Role</option>
                      <option value="SYSTEM">System Role</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Assign Permissions</label>
                  <div className="bg-gray-800/20 border border-gray-800/50 rounded-2xl p-6">
                    <div className="space-y-8">
                      {Object.entries(
                        permissions.reduce((acc: Record<string, Permission[]>, p) => {
                          if (!acc[p.subject]) acc[p.subject] = [];
                          acc[p.subject].push(p);
                          return acc;
                        }, {})
                      ).map(([subject, perms]) => (
                        <div key={subject} className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-gray-800/50 pb-2">
                            <Squares2X2Icon className="h-4 w-4 text-gray-500" />
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{subject} Permissions</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {perms.map(p => {
                              const isSelected = newRole.permissionIds.includes(p.id);
                              
                              // Icon mapping based on action
                              const getActionIcon = (action: string) => {
                                const a = action.toLowerCase();
                                if (a === 'read') return <EyeIcon className="h-4 w-4" />;
                                if (a === 'create') return <PlusCircleIcon className="h-4 w-4" />;
                                if (a === 'update' || a === 'edit') return <PencilSquareIcon className="h-4 w-4" />;
                                if (a === 'delete') return <TrashIcon className="h-4 w-4" />;
                                if (a === 'manage') return <ShieldCheckIcon className="h-4 w-4" />;
                                if (a === 'revert') return <ArrowUturnLeftIcon className="h-4 w-4" />;
                                return <InformationCircleIcon className="h-4 w-4" />;
                              };

                              const getActionColor = (action: string) => {
                                const a = action.toLowerCase();
                                if (a === 'delete') return isSelected ? 'bg-red-500 text-white' : 'text-red-400 group-hover:text-red-300';
                                if (a === 'manage') return isSelected ? 'bg-indigo-500 text-white' : 'text-indigo-400 group-hover:text-indigo-300';
                                if (a === 'create') return isSelected ? 'bg-emerald-500 text-white' : 'text-emerald-400 group-hover:text-emerald-300';
                                return isSelected ? 'bg-blue-600 text-white' : 'text-blue-400 group-hover:text-blue-300';
                              };

                              const getPermissionDescription = (action: string, subject: string) => {
                                const a = action.toLowerCase();
                                const s = subject.toLowerCase();
                                
                                if (s === 'asset') {
                                  if (a === 'read') return 'View and browse assets in the library';
                                  if (a === 'create') return 'Upload and add new assets';
                                  if (a === 'update') return 'Edit asset metadata and properties';
                                  if (a === 'delete') return 'Permanently remove assets';
                                  if (a === 'manage') return 'Full control over all asset operations';
                                  if (a === 'revert') return 'Restore previous asset versions';
                                }
                                
                                if (s === 'category') {
                                  if (a === 'read') return 'View and browse asset categories';
                                  if (a === 'create') return 'Create and organize new categories';
                                  if (a === 'update') return 'Modify category names and properties';
                                  if (a === 'delete') return 'Remove existing categories';
                                  if (a === 'manage') return 'Full control over category management';
                                }
                              
                                if (s === 'user') {
                                  if (a === 'read') return 'View system users and profiles';
                                  if (a === 'manage') return 'Manage user accounts and access';
                                }
                              
                                if (s === 'workspace') {
                                  if (a === 'manage') return 'Full administrative control of workspace';
                                }
                              
                                return `Grant ${a} access to ${s} resources`;
                              };

                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => togglePermission(p.id)}
                                  className={`group relative flex flex-col p-3 rounded-xl border transition-all text-left h-full min-h-[90px] ${
                                    isSelected 
                                      ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10' 
                                      : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className={`p-1.5 rounded-lg ${getActionColor(p.action)} bg-opacity-10 transition-colors`}>
                                      {getActionIcon(p.action)}
                                    </div>
                                    {isSelected && (
                                      <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center border border-gray-900">
                                        <CheckIcon className="h-2.5 w-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest block transition-colors ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>
                                      {p.action}
                                    </span>
                                    <span className="text-[9px] text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors line-clamp-2">
                                      {getPermissionDescription(p.action, subject)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-800/30 border-t border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  {submitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'roles' ? (
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/30">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Role Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Scope</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Permissions</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60 flex justify-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-xs">Loading roles...</span>
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-200">{role.name}</span>
                        {role.isSystem && (
                          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter">
                            <CheckIcon className="h-2 w-2" />
                            Built-in
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${
                        role.type === 'SYSTEM' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {role.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions && role.permissions.length > 0 ? (
                          <>
                            {role.permissions.map((p) => (
                              <span key={p.id} className="inline-flex px-1.5 py-0.5 bg-gray-800 text-gray-400 text-[9px] rounded border border-gray-700">
                                {p.action}:{p.subject}
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-600 italic">No permissions assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!role.isSystem && (
                          <>
                            <button
                              onClick={() => handleEditRequest(role)}
                              aria-label={`Edit ${role.name}`}
                              title="Edit"
                              className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoleRequest(role.id)}
                              aria-label={`Delete ${role.name}`}
                              title="Delete"
                              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/30">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Subject</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {perm.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-200">{perm.subject}</span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2 h-full min-h-[44px]">
                    <div className="p-1.5 bg-gray-800/50 rounded-lg">
                      <KeyIcon className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 italic font-medium uppercase tracking-widest">System Rule</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setRoleToDelete(null); }}
        onConfirm={confirmDeleteRole}
        title="Delete Role"
        message="Are you sure you want to delete this role? Users assigned to this role may lose access to critical features."
        isDeleting={isDeletingRole}
      />
    </div>
  );
}
