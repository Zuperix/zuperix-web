'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  UsersIcon, 
  PlusIcon, 
  UserPlusIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  BriefcaseIcon, 
  ShieldCheckIcon,
  XMarkIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Role {
  id: string;
  name: string;
  type: 'SYSTEM' | 'WORKSPACE';
}

interface Workspace {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  system_role: string;
  created_at: string;
}

interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  roleId: string;
  workspace: { id: string; name: string };
  role: { id: string; name: string };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    workspace_id: '',
    role_id: '',
  });

  const fetchData = async () => {
    try {
      const [usersData, rolesData, workspacesData] = await Promise.all([
        apiFetch<User[]>('/users'),
        apiFetch<Role[]>('/roles'),
        apiFetch<Workspace[]>('/workspaces'),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setWorkspaces(workspacesData);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberships = async (userId: string) => {
    try {
      const data = await apiFetch<Membership[]>(`/workspaces/users/${userId}/memberships`);
      setMemberships(data);
    } catch (err: any) {
      console.error('Failed to fetch memberships:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        ...newUser,
        workspace_id: newUser.workspace_id || undefined,
        role_id: newUser.role_id || undefined,
      };

      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowCreate(false);
      setNewUser({ email: '', name: '', password: '', workspace_id: '', role_id: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSystemRole = async (newRole: string) => {
    if (!editingUser) return;
    try {
      await apiFetch(`/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ system_role: newRole }),
      });
      setEditingUser({ ...editingUser, system_role: newRole });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddMembership = async (workspaceId: string, roleId: string) => {
    if (!editingUser || !workspaceId || !roleId) return;
    try {
      await apiFetch(`/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: editingUser.id, role_id: roleId }),
      });
      fetchMemberships(editingUser.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveMembership = async (workspaceId: string) => {
    if (!editingUser) return;
    try {
      await apiFetch(`/workspaces/${workspaceId}/members/${editingUser.id}`, {
        method: 'DELETE',
      });
      fetchMemberships(editingUser.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <UsersIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
            <p className="text-sm text-gray-500">Manage users, their access levels, and workspace assignments.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <PlusIcon className="h-4 w-4" />
          Add New User
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex justify-between items-center capitalize">
          {error}
          <button onClick={() => setError(null)}><XMarkIcon className="h-4 w-4" /></button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateUser}>
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-blue-500/10 rounded-lg">
                      <UserPlusIcon className="h-5 w-5 text-blue-400" />
                   </div>
                   <h2 className="text-xl font-bold text-white">Create New User</h2>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white transition-colors">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input
                      type="text" required value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      type="email" required value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Initial Password</label>
                  <input
                    type="password" required minLength={8} value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Workspace</label>
                    <select
                      value={newUser.workspace_id}
                      onChange={(e) => setNewUser({ ...newUser, workspace_id: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                    >
                      <option value="">No Workspace Assignment</option>
                      {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                    <select
                      value={newUser.role_id}
                      disabled={!newUser.workspace_id}
                      onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none disabled:opacity-50"
                    >
                      <option value="">Select Role</option>
                      {roles.filter(r => r.type === 'WORKSPACE').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-800/30 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Manage Access</h2>
                  <p className="text-xs text-gray-500">{editingUser.name} ({editingUser.email})</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="h-1 w-1 bg-purple-500 rounded-full" /> System Access
                </h3>
                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">System Role</label>
                    <p className="text-xs text-gray-500">Defines application-wide administrative privileges.</p>
                  </div>
                  <select
                    value={editingUser.system_role}
                    onChange={(e) => handleUpdateSystemRole(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                  >
                    <option value="USER">User (Regular)</option>
                    <option value="SUPER_ADMIN">Super Admin (Organization Manager)</option>
                  </select>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1 w-1 bg-blue-500 rounded-full" /> Workspace Memberships
                   </h3>
                </div>
                
                <div className="space-y-2">
                   {memberships.length === 0 ? (
                     <div className="px-4 py-8 text-center bg-gray-800/20 border border-dashed border-gray-800 rounded-xl text-gray-500 text-sm italic">
                        No workspace assignments yet.
                     </div>
                   ) : (
                     memberships.map(m => (
                       <div key={m.id} className="bg-gray-800/40 border border-gray-800 rounded-xl p-3 flex items-center justify-between hover:border-gray-700 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-500/10 rounded-lg">
                               <BriefcaseIcon className="h-4 w-4 text-indigo-400" />
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-gray-200">{m.workspace.name}</p>
                               <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                 {m.role.name}
                               </span>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveMembership(m.workspaceId)}
                            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                       </div>
                     ))
                   )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Add to Workspace</p>
                   <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     handleAddMembership(formData.get('ws') as string, formData.get('role') as string);
                     e.currentTarget.reset();
                   }}>
                      <select name="ws" required className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                        <option value="">Select Workspace</option>
                        {workspaces.filter(ws => !memberships.some(m => m.workspaceId === ws.id)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <select name="role" required className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                        <option value="">Select Role</option>
                        {roles.filter(r => r.type === 'WORKSPACE').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center p-2 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                      </button>
                   </form>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/30 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4 border-b border-gray-800/60">User info</th>
                <th className="px-6 py-4 border-b border-gray-800/60">System Role</th>
                <th className="px-6 py-4 border-b border-gray-800/60">Joined</th>
                <th className="px-6 py-4 border-b border-gray-800/60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-200">{user.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${
                      user.system_role === 'SUPER_ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {user.system_role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-mono">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setEditingUser(user); fetchMemberships(user.id); }}
                      className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4 decoration-gray-700 hover:decoration-white"
                    >
                      Manage Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
