'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ShieldCheckIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  const [newRole, setNewRole] = useState({ name: '', type: 'WORKSPACE' as const, permissionIds: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

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
      await apiFetch('/roles', {
        method: 'POST',
        body: JSON.stringify(newRole),
      });
      setShowCreate(false);
      setNewRole({ name: '', type: 'WORKSPACE', permissionIds: [] });
      fetchData();
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (id: string) => {
    setNewRole(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(pid => pid !== id)
        : [...prev.permissionIds, id]
    }));
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await apiFetch(`/roles/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete role:', error);
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
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <PlusIcon className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <form onSubmit={handleCreateRole}>
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">New Role</h2>
                <p className="text-xs text-gray-500 mt-1">Define properties and permissions for the new access role.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Assign Permissions</label>
                  <div className="h-48 overflow-y-auto bg-gray-800/50 border border-gray-700 rounded-xl p-2 space-y-1 custom-scrollbar">
                    {permissions.map(p => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors group">
                        <input
                          type="checkbox"
                          checked={newRole.permissionIds.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                          className="h-4 w-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500/40 bg-gray-900"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-200 uppercase tracking-tight">{p.action}</span>
                          <span className="text-[9px] text-gray-500 font-mono">{p.subject}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-800/30 flex items-center justify-end gap-3">
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
                  {submitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
