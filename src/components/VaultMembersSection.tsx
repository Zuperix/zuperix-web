'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  TrashIcon, 
  ShieldCheckIcon,
  UserIcon,
  CheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

export enum VaultRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

interface Member {
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  role: VaultRole;
}

interface VaultMembersSectionProps {
  vaultId: string;
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export default function VaultMembersSection({ 
  vaultId, 
  workspaceId, 
  currentUserId,
  isAdmin 
}: VaultMembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<VaultRole>(VaultRole.VIEWER);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Backend: The vault object itself can have members, but we can also fetch them via a dedicated logic if needed.
      // For now, let's assume we can fetch the vault details which includes members.
      const vaultData = await apiFetch<any>(`/workspaces/${workspaceId}/vaults/${vaultId}`);
      
      // Map members and fetch user details if needed. 
      // The backend service includes VaultMember, but does it include User model? 
      // Let's check the service again.
      setMembers(vaultData.members || []);
    } catch (error) {
      console.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [vaultId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;
    try {
      setInviting(true);
      await apiFetch(`/workspaces/${workspaceId}/vaults/${vaultId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: inviteUserId, role: inviteRole }),
      });
      toast.success('Member invited successfully');
      setInviteUserId('');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: VaultRole) => {
    try {
      await apiFetch(`/workspaces/${workspaceId}/vaults/${vaultId}/members/${targetUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      toast.success('Role updated');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await apiFetch(`/workspaces/${workspaceId}/vaults/${vaultId}/members/${targetUserId}`, {
        method: 'DELETE',
      });
      toast.success('Member removed');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const isOwner = members.find(m => m.userId === currentUserId)?.role === VaultRole.OWNER || isAdmin;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isOwner && (
        <div className="bg-gray-900/40 border border-blue-500/20 rounded-[32px] p-8 shadow-2xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5 text-blue-500" />
              Invite to Vault
            </h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Assign roles to workspace members</p>
          </div>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="User ID or search user..."
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                value={inviteUserId}
                onChange={e => setInviteUserId(e.target.value)}
              />
            </div>
            <div className="sm:w-48 relative">
                <select 
                  className="w-full h-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as VaultRole)}
                >
                  <option value={VaultRole.VIEWER}>Viewer</option>
                  <option value={VaultRole.EDITOR}>Editor</option>
                  <option value={VaultRole.OWNER}>Owner</option>
                </select>
                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <button 
              type="submit"
              disabled={inviting || !inviteUserId}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 transition-all shadow-xl shadow-blue-900/40"
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
          Vault Members ({members.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map(member => (
            <div 
              key={member.userId}
              className="group flex items-center justify-between p-5 rounded-3xl bg-gray-900/40 border border-gray-800 hover:border-blue-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400">
                    {member.user?.name?.charAt(0) || <UserIcon className="h-5 w-5" />}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">{member.user?.name || member.userId}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{member.role}</p>
                </div>
              </div>

              {isOwner && member.userId !== currentUserId && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select 
                    className="bg-gray-800 border-none text-[10px] font-bold text-gray-400 uppercase tracking-widest rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
                    value={member.role}
                    onChange={e => handleUpdateRole(member.userId, e.target.value as VaultRole)}
                  >
                    <option value={VaultRole.VIEWER}>Viewer</option>
                    <option value={VaultRole.EDITOR}>Editor</option>
                    <option value={VaultRole.OWNER}>Owner</option>
                  </select>
                  <button 
                    onClick={() => handleRemoveMember(member.userId)}
                    className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {member.userId === currentUserId && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
