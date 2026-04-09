'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import FeatureLocked from '@/components/FeatureLocked';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  scopes: string[];
}

interface Customer {
  id: string;
  name: string;
  plan: string;
}

interface UsageStat {
  date: string;
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_latency: number;
}

const AVAILABLE_SCOPES = [
  { id: 'all', label: 'Full Access', description: 'Can perform any action', group: 'general' },
  { id: 'search:read', label: 'Search Assets', description: 'Full-text and semantic search', group: 'search' },
  { id: 'asset:read', label: 'Read Assets', description: 'List and view asset details', group: 'assets' },
  { id: 'asset:write', label: 'Update Assets', description: 'Update asset status, name, and dates', group: 'assets' },
  { id: 'asset.add', label: 'Upload Assets', description: 'Upload files and metadata', group: 'assets' },
  { id: 'asset.delete', label: 'Delete Assets', description: 'Remove assets from library', group: 'assets' },
  { id: 'collection:read', label: 'Read Collections', description: 'List collections and their assets', group: 'collections' },
  { id: 'collection:write', label: 'Manage Collections', description: 'Create collections, add/remove assets', group: 'collections' },
  { id: 'category:read', label: 'Read Categories', description: 'View category tree', group: 'categories' },
  { id: 'category:write', label: 'Manage Categories', description: 'Assign assets to categories', group: 'categories' },
  { id: 'tag:read', label: 'Read Tags', description: 'List workspace tags', group: 'tags' },
  { id: 'tag:write', label: 'Manage Tags', description: 'Add and remove tags on assets', group: 'tags' },
];

export default function ApiKeysPage() {
  const { activeWorkspace } = useWorkspace();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['search:read']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState<ApiKey | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [customerPlan, setCustomerPlan] = useState<string | null>(null);

  const [showRevokeModal, setShowRevokeModal] = useState<{ id: string, name: string } | null>(null);
  const [revokeConfirmation, setRevokeConfirmation] = useState('');

  useEffect(() => {
    if (activeWorkspace) {
      fetchKeys();
      fetchCustomerPlan();
    }
  }, [activeWorkspace]);

  const fetchCustomerPlan = async () => {
    try {
      const data = await apiFetch<Customer[]>('/customers');
      if (data && data.length > 0) {
        setCustomerPlan(data[0].plan);
      }
    } catch (e) {
      console.error('Failed to fetch plan:', e);
    }
  };

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ApiKey[]>(`/workspaces/${activeWorkspace?.id}/api-keys`);
      setKeys(data);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName || !activeWorkspace) return;
    try {
      const { api_key } = await apiFetch<{ api_key: string }>(`/workspaces/${activeWorkspace.id}/api-keys`, {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName,
          scopes: selectedScopes
        }),
      });
      setCreatedKey(api_key);
      setNewKeyName('');
      setSelectedScopes(['search:read']);
      setShowCreateModal(false);
      fetchKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRevokeKey = async () => {
    if (!showRevokeModal || revokeConfirmation !== 'REVOKE') return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace?.id}/api-keys/${showRevokeModal.id}`, {
        method: 'DELETE',
      });
      setShowRevokeModal(null);
      setRevokeConfirmation('');
      fetchKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const fetchUsage = async (key: ApiKey) => {
    try {
      setLoadingUsage(true);
      setShowUsageModal(key);
      const data = await apiFetch<UsageStat[]>(`/workspaces/${activeWorkspace?.id}/api-keys/${key.id}/usage`);
      setUsageStats(data);
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const toggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  if (customerPlan?.toLowerCase() === 'bronze') {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <FeatureLocked 
          featureName="API Access" 
          description="Elevate your workflow with programmatic access. Unlock dedicated API keys to automate asset management and build custom integrations."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">API Keys</h1>
          <p className="text-gray-400">Manage API keys for programmatic access to your assets.</p>
        </div>
        {!createdKey && (
          <button
            onClick={() => {
              setCreatedKey(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Create Key
          </button>
        )}
      </div>

      {createdKey && (
        <div className="mb-10 p-8 bg-amber-500/5 border border-amber-500/20 rounded-3xl relative overflow-hidden backdrop-blur-md animate-in slide-in-from-top duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <KeyIcon className="h-24 w-24 text-amber-400 rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-amber-400 font-black text-xl">
              <KeyIcon className="h-8 w-8" />
              API Key Created Successfully
            </div>

            <div className="mb-6 p-4 bg-amber-950/30 border border-amber-500/10 rounded-2xl">
              <p className="text-amber-200/80 font-medium mb-1">⚠️ Security Warning</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Copy this key now. For your security, <span className="font-bold text-amber-200">it will never be shown again</span>.
                If you lose it, you will need to revoke it and create a new one.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="flex items-center gap-2 bg-gray-950 p-4 rounded-xl border border-gray-800 group shadow-inner">
                <code className="text-blue-400 flex-1 break-all overflow-hidden text-sm font-mono tracking-wider">
                  {createdKey}
                </code>
                <button
                  onClick={() => copyToClipboard(createdKey)}
                  className="p-3 bg-gray-900 rounded-lg transition-all text-gray-400 hover:text-white hover:scale-105 active:scale-95 border border-gray-800"
                >
                  {copying ? (
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-6 w-6" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setCreatedKey(null)}
                className="self-start px-6 py-3 bg-amber-500 text-amber-950 font-black rounded-xl hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/20"
              >
                I have saved this key
              </button>
            </div>
          </div>

          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/40" />
        </div>
      )}

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-4">
            <KeyIcon className="h-10 w-10 opacity-20" />
            No API keys found.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-center w-5"></th>
                <th className="px-6 py-4">Name & Scopes</th>
                <th className="px-6 py-4 text-center">Last Used</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {keys.map((key) => (
                <tr key={key.id} className="group hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-gray-200 font-bold">{key.name}</div>
                      <div className="flex gap-2">
                        <code className="bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-400 font-mono tracking-tighter">
                          {key.key_prefix}...
                        </code>
                        <div className="flex gap-1">
                          {key.scopes?.map(scope => (
                            <span key={scope} className="px-1.5 py-0.5 bg-blue-500/5 text-blue-400/70 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-500/10">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-sm font-medium">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => fetchUsage(key)}
                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                        title="View Usage"
                      >
                        <ChartBarIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setShowRevokeModal({ id: key.id, name: key.name })}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Revoke Key"
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

      {showUsageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">API Usage</h2>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  Last 30 days of activity for <span className="text-blue-400 font-bold">"{showUsageModal.name}"</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 ml-1">
                    Updated Hourly
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUsageModal(null);
                  setUsageStats([]);
                }}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loadingUsage ? (
              <div className="py-20 text-center text-gray-500">Loading stats...</div>
            ) : usageStats.length === 0 ? (
              <div className="py-20 text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                No usage recorded for this key yet.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Requests', value: usageStats.reduce((acc, curr) => Number(acc) + Number(curr.total_requests), 0), color: 'text-blue-400' },
                    { label: 'Success Rate', value: `${((usageStats.reduce((acc, curr) => Number(acc) + Number(curr.success_count), 0) / usageStats.reduce((acc, curr) => Number(acc) + Number(curr.total_requests), 0)) * 100).toFixed(1)}%`, color: 'text-green-500' },
                    { label: 'Avg Latency', value: `${(usageStats.reduce((acc, curr) => Number(acc) + Number(curr.avg_latency), 0) / usageStats.length).toFixed(0)}ms`, color: 'text-purple-400' },
                    { label: 'Error Count', value: usageStats.reduce((acc, curr) => Number(acc) + Number(curr.error_count), 0), color: 'text-red-400' },
                  ].map(metric => (
                    <div key={metric.label} className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{metric.label}</div>
                      <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Requests</th>
                        <th className="px-6 py-3">Success</th>
                        <th className="px-6 py-3 text-right">Avg Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {usageStats.map(stat => (
                        <tr key={stat.date}>
                          <td className="px-6 py-3 text-sm text-gray-300">{stat.date}</td>
                          <td className="px-6 py-3 text-sm text-white font-medium">{stat.total_requests}</td>
                          <td className="px-6 py-3 text-sm">
                            <span className="text-green-500 font-bold">{stat.success_count}</span>
                            <span className="text-gray-600 ml-1">({((stat.success_count / stat.total_requests) * 100).toFixed(0)}%)</span>
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-400">{stat.avg_latency.toFixed(0)}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 max-w-xl w-full shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -mr-8 -mt-8">
              <PlusIcon className="h-48 w-48 text-blue-400" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2">New API Key</h2>
            <p className="text-gray-400 text-sm mb-8">
              Configure access permissions and identification for your new key.
            </p>

            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Friendly Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Mobile App Production"
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-gray-700 shadow-inner"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Select Scopes</label>
                <div className="max-h-[360px] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                  {/* Full Access - standalone */}
                  {AVAILABLE_SCOPES.filter(s => s.group === 'general').map(scope => (
                    <button
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group w-full ${selectedScopes.includes(scope.id)
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-100'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-900/40'
                        }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${selectedScopes.includes(scope.id) ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'
                        }`}>
                        <ShieldCheckIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${selectedScopes.includes(scope.id) ? 'text-white' : ''}`}>{scope.label}</div>
                        <div className="text-[10px] opacity-60">{scope.description}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedScopes.includes(scope.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-700'
                        }`}>
                        {selectedScopes.includes(scope.id) && <ChevronRightIcon className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  ))}

                  {/* Granular scopes grouped by domain */}
                  {['search', 'assets', 'collections', 'categories', 'tags'].map(group => {
                    const groupScopes = AVAILABLE_SCOPES.filter(s => s.group === group);
                    if (groupScopes.length === 0) return null;
                    const groupLabel = group.charAt(0).toUpperCase() + group.slice(1);
                    return (
                      <div key={group}>
                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 pl-1">{groupLabel}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {groupScopes.map(scope => (
                            <button
                              key={scope.id}
                              onClick={() => toggleScope(scope.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${selectedScopes.includes(scope.id)
                                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-100'
                                  : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-900/40'
                                }`}
                            >
                              <div className={`p-1.5 rounded-md transition-colors ${selectedScopes.includes(scope.id) ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'
                                }`}>
                                <ShieldCheckIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-bold truncate ${selectedScopes.includes(scope.id) ? 'text-white' : ''}`}>{scope.label}</div>
                                <div className="text-[9px] opacity-60 truncate">{scope.description}</div>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedScopes.includes(scope.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-700'
                                }`}>
                                {selectedScopes.includes(scope.id) && <ChevronRightIcon className="h-2.5 w-2.5 text-white" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-900 text-gray-400 rounded-2xl hover:bg-gray-800 hover:text-white transition-all font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  disabled={!newKeyName || selectedScopes.length === 0}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-black text-sm disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(37,99,235,0.3)]"
                >
                  Generate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-950 border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40" />

            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 rounded-full mb-4">
                <TrashIcon className="h-8 w-8 text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Revoke API Key?</h2>
              <div className="bg-red-950/20 border border-red-500/10 rounded-2xl p-4 mb-6">
                <p className="text-sm text-red-200/80 mb-2 font-bold uppercase tracking-tight text-center">Serious Impact Warning</p>
                <p className="text-sm text-gray-400 leading-relaxed text-center">
                  Revoking <span className="font-bold text-white">"{showRevokeModal.name}"</span> will immediately break any active integrations or SDK clients using this key. This action is <span className="font-bold text-red-400">permanent</span>.
                </p>
              </div>

              <div className="w-full space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                    Type <span className="text-red-400">REVOKE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={revokeConfirmation}
                    onChange={(e) => setRevokeConfirmation(e.target.value)}
                    placeholder="REVOKE"
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono tracking-widest text-center"
                    autoFocus
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowRevokeModal(null);
                      setRevokeConfirmation('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-900 text-gray-400 rounded-xl hover:bg-gray-800 hover:text-white transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRevokeKey}
                    disabled={revokeConfirmation !== 'REVOKE'}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all font-black disabled:opacity-20 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/20"
                  >
                    REVOKE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
