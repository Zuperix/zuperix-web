'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { KeyIcon } from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  action: string;
  subject: string;
  conditions?: any;
  description?: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await apiFetch<Permission[]>('/permissions');
        setPermissions(data);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-500/10 rounded-xl">
          <KeyIcon className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Permissions</h1>
          <p className="text-sm text-gray-500">A read-only list of all actions and subjects available in the RBAC system.</p>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/30">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Action</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Subject</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex justify-center flex-col items-center gap-2">
                    <div className="h-5 w-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-xs">Loading permissions...</span>
                  </div>
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No permissions found.
                </td>
              </tr>
            ) : (
              permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {perm.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-200">{perm.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400 italic font-medium">{perm.description || '-'}</span>
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
