'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  GlobeAltIcon, 
  PlusIcon, 
  TrashIcon, 
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
  PlayIcon,
  ClockIcon,
  KeyIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import type { Webhook, WebhookLog, WebhookStats } from '@/types/webhooks';
import { toast } from 'sonner';

const SlackIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.0423,19.1661A2.5212,2.5212,0,1,1,6.5212,16.645H9.0423Z" fill="#36c5f0"/>
    <path d="M10.3127,19.1661a2.5212,2.5212,0,0,1,5.0423,0v6.3127a2.5212,2.5212,0,1,1-5.0423,0Z" fill="#e01e5a"/>
    <path d="M12.8339,9.0423A2.5212,2.5212,0,1,1,15.355,6.5212V9.0423Z" fill="#2eb67d"/>
    <path d="M12.8339,10.3127a2.5212,2.5212,0,0,1,0,5.0423H6.5212a2.5212,2.5212,0,1,1,0-5.0423Z" fill="#36c5f0"/>
    <path d="M22.9577,12.8339a2.5212,2.5212,0,1,1,2.5211,2.5211H22.9577Z" fill="#ecb22e"/>
    <path d="M21.6873,12.8339a2.5212,2.5212,0,0,1-5.0423,0V6.5212a2.5212,2.5212,0,1,1,5.0423,0Z" fill="#2eb67d"/>
    <path d="M19.1661,22.9577a2.5212,2.5212,0,1,1-2.5211,2.5211V22.9577Z" fill="#e01e5a"/>
    <path d="M19.1661,21.6873a2.5212,2.5212,0,0,1,0-5.0423h6.3127a2.5212,2.5212,0,1,1,0,5.0423Z" fill="#ecb22e"/>
  </svg>
);

const DiscordIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 -28.5 256 256" xmlns="http://www.w3.org/2000/svg">
    <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" fill="#5865F2" />
  </svg>
);

export default function WebhooksPage() {
  const { activeWorkspace } = useWorkspace();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<{ webhook: Webhook, logs: WebhookLog[] } | null>(null);
  const [selectedStats, setSelectedStats] = useState<{ webhook: Webhook, stats: WebhookStats } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: ['asset.uploaded'] as string[],
    secret: '',
    type: 'generic' as 'generic' | 'slack' | 'discord',
  });

  const fetchWebhooks = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const data = await apiFetch<Webhook[]>(`/webhooks?workspace_id=${activeWorkspace.id}`);
      setWebhooks(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [activeWorkspace]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    
    const trimmedUrl = newWebhook.url.trim();
    if (!trimmedUrl) {
      toast.error('URL is required');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          ...newWebhook,
          url: trimmedUrl,
          workspace_id: activeWorkspace.id,
        }),
      });
      setShowCreate(false);
      setNewWebhook({ url: '', events: ['asset.uploaded'], secret: '', type: 'generic' });
      toast.success('Webhook registered successfully');
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch(`/webhooks/${webhook.id}?workspace_id=${activeWorkspace.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !webhook.is_active }),
      });
      toast.success(`Webhook ${!webhook.is_active ? 'activated' : 'paused'}`);
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace || !deleteId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/webhooks/${deleteId}?workspace_id=${activeWorkspace.id}`, {
        method: 'DELETE',
      });
      toast.success('Webhook deleted successfully');
      setDeleteId(null);
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const viewLogs = async (webhook: Webhook) => {
    if (!activeWorkspace) return;
    try {
      const logs = await apiFetch<WebhookLog[]>(`/webhooks/${webhook.id}/logs?workspace_id=${activeWorkspace.id}`);
      setSelectedLogs({ webhook, logs });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const viewStats = async (webhook: Webhook) => {
    if (!activeWorkspace) return;
    try {
      const stats = await apiFetch<WebhookStats>(`/webhooks/${webhook.id}/stats?workspace_id=${activeWorkspace.id}`);
      setSelectedStats({ webhook, stats });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!activeWorkspace) return <div className="p-8 text-center text-gray-400">Please select a workspace</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <GlobeAltIcon className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Webhook Management</h1>
            <p className="text-sm text-gray-500">Configure real-time notifications for system events.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-95"
        >
          <PlusIcon className="h-4 w-4" />
          Register New Webhook
        </button>
      </div>

      {/* Webhook List */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/30 text-[10px] text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">URL</th>
                <th className="px-6 py-4">Events</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading webhooks...</td></tr>
              ) : webhooks.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No webhooks registered yet.</td></tr>
              ) : webhooks.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleActive(webhook)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        webhook.is_active 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                      }`}
                    >
                      {webhook.is_active ? <CheckCircleIcon className="h-3 w-3" /> : <PauseIcon className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        webhook.type === 'slack' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        webhook.type === 'discord' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {webhook.type === 'slack' && <SlackIcon className="h-3 w-3" />}
                        {webhook.type === 'discord' && <DiscordIcon className="h-3 w-3" />}
                        {webhook.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-200">{webhook.url}</span>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">Secret: {webhook.secret.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map(event => (
                        <span key={event} className="px-1.5 py-0.5 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded text-[10px] font-mono">
                          {event}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => viewStats(webhook)}
                        className="p-1.5 text-gray-400 hover:text-indigo-400 bg-gray-800/50 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="View Statistics"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => viewLogs(webhook)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 bg-gray-800/50 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View Logs"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(webhook.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-800/50 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Webhook Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreate}>
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg"><PlusIcon className="h-5 w-5 text-indigo-400" /></div>
                  Create Webhook
                </h2>
                <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <GlobeAltIcon className="h-3 w-3" /> Payload URL
                  </label>
                  <input
                    type="url" required value={newWebhook.url}
                    onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/40 outline-none"
                    placeholder="https://your-app.com/webhook"
                  />
                  <p className="mt-1.5 text-[10px] text-gray-500">Only HTTPS URLs are allowed for security.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <KeyIcon className="h-3 w-3" /> Secret Token (Optional)
                  </label>
                  <input
                    type="text" value={newWebhook.secret}
                    onChange={e => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/40 outline-none"
                    placeholder="Leave empty to auto-generate"
                  />
                  <p className="mt-1.5 text-[10px] text-gray-500">Used to sign the payload header (X-Webhook-Signature).</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ArrowsRightLeftIcon className="h-3 w-3" /> Webhook Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'generic', name: 'Generic', icon: GlobeAltIcon, color: 'text-gray-400', activeBg: 'bg-gray-500/10' },
                      { id: 'slack', name: 'Slack', icon: SlackIcon, color: 'text-orange-400', activeBg: 'bg-orange-500/10' },
                      { id: 'discord', name: 'Discord', icon: DiscordIcon, color: 'text-indigo-400', activeBg: 'bg-indigo-500/10' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewWebhook({ ...newWebhook, type: type.id as any })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                          newWebhook.type === type.id 
                            ? `border-indigo-500/50 ${type.activeBg} ring-1 ring-indigo-500/20` 
                            : 'border-gray-800 bg-gray-800/20 hover:border-gray-700'
                        }`}
                      >
                        <type.icon className={`h-6 w-6 ${newWebhook.type === type.id ? type.color : 'text-gray-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${newWebhook.type === type.id ? 'text-white' : 'text-gray-500'}`}>
                          {type.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-gray-500 flex items-center gap-1.5">
                    <InformationCircleIcon className="h-3.5 w-3.5" />
                    {newWebhook.type === 'slack' && 'Receive beautifully formatted Block Kit notifications in Slack.'}
                    {newWebhook.type === 'discord' && 'Send rich embeds to your Discord channels.'}
                    {newWebhook.type === 'generic' && 'Send standard JSON payloads to your custom API endpoint.'}
                  </p>
                </div>
                <div>
                  <p className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ArrowsRightLeftIcon className="h-3 w-3" /> Events to Subscribe
                  </p>
                  <div className="space-y-2">
                    {['asset.uploaded', 'asset.updated', 'asset.deleted', 'asset.restored'].map(ev => (
                      <label key={ev} className="flex items-center gap-3 p-3 bg-gray-800/40 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={newWebhook.events.includes(ev)} 
                          onChange={(e) => {
                            const events = e.target.checked 
                              ? [...newWebhook.events, ev]
                              : newWebhook.events.filter(x => x !== ev);
                            setNewWebhook({ ...newWebhook, events });
                          }}
                          className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-indigo-600 focus:ring-offset-gray-900" 
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-200">{ev}</p>
                          <p className="text-[10px] text-gray-500">
                            {ev === 'asset.uploaded' && 'Triggered when a new asset is successfully uploaded.'}
                            {ev === 'asset.updated' && 'Triggered when metadata or organization of an asset is changed.'}
                            {ev === 'asset.deleted' && 'Triggered when an asset is soft-deleted or permanently purged.'}
                            {ev === 'asset.restored' && 'Triggered when an asset is restored from the trash.'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-800/30 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="p-1.5 bg-red-500/10 rounded-lg"><TrashIcon className="h-5 w-5 text-red-400" /></div>
                Delete Webhook
              </h2>
              <button type="button" onClick={() => setDeleteId(null)} className="text-gray-500 hover:text-white">×</button>
            </div>
            <div className="p-6">
              <p className="text-gray-300">Are you sure you want to delete this webhook? This will also remove all associated delivery logs. This action cannot be undone.</p>
            </div>
            <div className="p-6 bg-gray-800/30 flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setDeleteId(null)} 
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Deleting...' : 'Delete Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {selectedLogs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-blue-400" />
                  Delivery Logs
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedLogs.webhook.url}</p>
              </div>
              <button onClick={() => setSelectedLogs(null)} className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-4">
                {selectedLogs.logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 italic">No delivery attempts recorded yet.</div>
                ) : selectedLogs.logs.map(log => (
                  <div key={log.id} className="bg-gray-800/20 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between bg-gray-800/20">
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {log.status_code || '---'} {log.status}
                        </span>
                        <span className="text-xs font-mono text-gray-300">{log.event}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                        <span>{log.response_time}ms</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {log.error_message && (
                      <div className="p-3 bg-red-500/5 text-[10px] text-red-400 font-mono border-t border-red-500/10">
                        Error: {log.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-indigo-400" />
                Performance Stats
              </h2>
              <button onClick={() => setSelectedStats(null)} className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-gray-800/40 rounded-2xl border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{selectedStats.stats.total_deliveries}</p>
                </div>
                <div className="p-4 bg-gray-800/40 rounded-2xl border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Success</p>
                  <p className="text-2xl font-bold text-green-400">{selectedStats.stats.success_rate.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-gray-800/40 rounded-2xl border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg Latency</p>
                  <p className="text-2xl font-bold text-blue-400">{Math.round(selectedStats.stats.avg_response_time)}ms</p>
                </div>
                <div className="p-4 bg-gray-800/40 rounded-2xl border border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Failures</p>
                  <p className="text-2xl font-bold text-red-400">{selectedStats.stats.failed_deliveries}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <InformationCircleIcon className="h-4 w-4" /> Retry Distribution
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedStats.stats.retry_distribution).map(([attempt, count]) => {
                    const percentage = (Number(count) / selectedStats.stats.total_deliveries) * 100;
                    return (
                      <div key={attempt} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-gray-400">
                          <span>Attempt {attempt}</span>
                          <span>{count} deliveries ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
