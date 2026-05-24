'use client';

import { useAssetHistory } from '@/hooks/useAssetHistory';
import { 
  ClockIcon, 
  ArrowUpTrayIcon, 
  ArrowPathIcon, 
  PencilSquareIcon,
  TrashIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  TagIcon,
  Square3Stack3DIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckBadgeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { apiFetch, apiDownload } from '@/lib/api';
import { toast } from 'sonner';

const ACTION_ICONS: Record<string, any> = {
  UPLOAD: ArrowUpTrayIcon,
  DOWNLOAD: ArrowDownTrayIcon,
  VIEW: EyeIcon,
  UPDATE: PencilSquareIcon,
  DELETE: TrashIcon,
  METADATA_UPDATE: PencilSquareIcon,
  TAGS_ADDED: TagIcon,
  TAGS_REMOVED: TagIcon,
  ORGANIZATION_UPDATE: Square3Stack3DIcon,
  VERSION_UPLOAD: ArrowUpTrayIcon,
  VERSION_REVERT: ArrowPathIcon,
  WORKFLOW_STARTED: PlayIcon,
  WORKFLOW_STEP_APPROVED: CheckCircleIcon,
  WORKFLOW_STEP_REJECTED: XCircleIcon,
  WORKFLOW_COMPLETED: CheckBadgeIcon,
};

const ACTION_COLORS: Record<string, string> = {
  UPLOAD: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  DOWNLOAD: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  VIEW: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  UPDATE: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  METADATA_UPDATE: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  TAGS_ADDED: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  TAGS_REMOVED: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  ORGANIZATION_UPDATE: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  VERSION_UPLOAD: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  VERSION_REVERT: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  WORKFLOW_STARTED: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  WORKFLOW_STEP_APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  WORKFLOW_STEP_REJECTED: 'text-red-400 bg-red-400/10 border-red-400/20',
  WORKFLOW_COMPLETED: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
};

export default function AssetHistory({ assetId }: { assetId: string }) {
  const { history, loading, error } = useAssetHistory(assetId);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const handleDownloadCsv = async () => {
    try {
      const blob = await apiDownload(`/audit/assets/${assetId}/export`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${assetId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Audit log CSV downloaded successfully');
    } catch (err: any) {
      console.error('Download failed:', err);
      toast.error('Failed to download audit log CSV');
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50/30 dark:bg-gray-900/10 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 m-4">
        <ClockIcon className="h-12 w-12 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No activity history recorded yet</p>
      </div>
    );
  }

  const renderMetadata = (event: any) => {
    const meta = event.metadata;
    const changes = event.changes;

    if (changes) {
      return (
        <div className="mt-2 space-y-1.5">
          {Object.entries(changes).map(([field, delta]: [string, any]) => {
            const isArray = Array.isArray(delta.old) || Array.isArray(delta.new);
            
            return (
              <div key={field} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">{field.replace(/_/g, ' ')}:</span>
                  <div className="flex items-center gap-1">
                    <span className="bg-red-500/10 text-red-400/80 px-1.5 py-0.5 rounded line-through border border-red-500/10">
                      {isArray ? (delta.old?.length ? delta.old.join(', ') : 'none') : String(delta.old ?? 'none')}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                      {isArray ? (delta.new?.length ? delta.new.join(', ') : 'none') : String(delta.new ?? 'none')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (!meta) return null;

    if (meta.type === 'TAGS_ADDED' || meta.type === 'TAGS_REMOVED') {
      return (
        <div className="mt-2 flex flex-wrap gap-1 items-center text-[11px]">
          <span className="text-gray-500">{meta.type === 'TAGS_ADDED' ? 'Added:' : 'Removed:'}</span>
          {meta.tags?.map((t: string) => (
            <span key={t} className={`px-1.5 py-0.5 rounded border ${meta.type === 'TAGS_ADDED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
              {t}
            </span>
          ))}
        </div>
      );
    }

    if (meta.type === 'METADATA_UPDATED') {
      return (
        <div className="mt-2 space-y-1.5">
          {Object.entries(meta.changes || {}).map(([field, delta]: [string, any]) => (
            <div key={field} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider">{field.replace(/_/g, ' ')}:</span>
                <div className="flex items-center gap-1">
                  <span className="bg-red-500/10 text-red-400/80 px-1.5 py-0.5 rounded border border-red-500/10">
                    {String(delta.old ?? 'none')}
                  </span>
                  <span className="text-gray-600">→</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                    {String(delta.new ?? 'none')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (meta.type === 'RATING_UPDATED') {
      return (
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <span className="text-gray-500">Rating set to:</span>
          <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg border border-amber-500/20 font-bold">
            {meta.rating} / 5
          </span>
        </div>
      );
    }

    if (meta.type === 'VERSION_UPLOAD' || meta.type === 'VERSION_REVERT') {
        return (
          <div className="mt-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800 text-[11px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Version info</span>
              <span className="bg-blue-500/20 text-blue-400 px-1 rounded uppercase font-bold tracking-tighter">v{meta.version || meta.new_version}</span>
            </div>
            {meta.notes && <p className="text-gray-500 italic">"{meta.notes}"</p>}
            {meta.reverted_to && <p className="text-amber-500/80">Reverted from v{meta.reverted_to}</p>}
          </div>
        );
    }

    if (event.action.startsWith('WORKFLOW_')) {
      return (
        <div className="mt-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] space-y-1">
          {meta.workflowName && <p className="text-blue-400/80 font-bold uppercase tracking-tight">{meta.workflowName}</p>}
          {meta.stageName && (
            <p className="text-gray-400 flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-black text-gray-500">Stage:</span>
              <span className="font-medium text-gray-300">{meta.stageName}</span>
            </p>
          )}
          {meta.comment && (
            <p className="text-gray-500 italic border-l-2 border-gray-700 pl-2 mt-1 py-0.5">"{meta.comment}"</p>
          )}
        </div>
      );
    }

    if (event.action === 'DOWNLOAD' && meta) {
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
            {meta.usage_type || 'download'}
          </span>
          {meta.custom_purpose && (
            <span className="text-[10px] text-gray-500 italic border-l-2 border-gray-700 pl-2">
              &ldquo;{meta.custom_purpose}&rdquo;
            </span>
          )}
        </div>
      );
    }

    if (meta.filename) {
      return <p className="mt-1 text-[11px] text-blue-400/80 italic">&ldquo;{meta.filename}&rdquo;</p>;
    }

    return null;
  };

  const getEventTitle = (event: any) => {
    switch(event.metadata?.type || event.action) {
      case 'ORGANIZATION_UPDATE': return 'Updated organization';
      case 'TAGS_ADDED': return 'Added tags';
      case 'TAGS_REMOVED': return 'Removed tags';
      case 'METADATA_UPDATE': return 'Updated metadata';
      case 'VERSION_UPLOAD': return 'Uploaded new version';
      case 'VERSION_REVERT': return 'Reverted to old version';
      case 'WORKFLOW_STARTED': return 'Started approval workflow';
      case 'WORKFLOW_STEP_APPROVED': return 'Approved workflow stage';
      case 'WORKFLOW_STEP_REJECTED': return 'Rejected workflow stage';
      case 'WORKFLOW_COMPLETED': return 'Completed approval workflow';
      case 'DOWNLOAD': return 'Downloaded asset';
      default: return event.action.toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <ClockIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Audit Trail</h3>
            <p className="text-[10px] text-gray-500 font-medium">{history.length} events recorded</p>
          </div>
        </div>
        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-[11px] font-bold text-gray-300 hover:text-white transition-all shadow-sm"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Download Report
        </button>
      </div>

      <ul role="list" className="space-y-0">
        {history.map((event, eventIdx) => {
          const Icon = ACTION_ICONS[event.metadata?.type || event.action] || ClockIcon;
          const colorClass = ACTION_COLORS[event.metadata?.type || event.action] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
          const initials = event.user?.name ? event.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'S';
          
          return (
            <li key={event.id} className="group">
              <div className="relative pb-10">
                {eventIdx !== history.length - 1 ? (
                  <span
                    className="absolute left-[19px] top-10 -ml-px h-[calc(100%-8px)] w-0.5 bg-gradient-to-b from-gray-800 to-transparent group-hover:from-blue-900/30 transition-colors duration-300"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-4">
                  {/* User Avatar Circle */}
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shadow-xl overflow-hidden group-hover:border-blue-500/30 transition-all duration-300">
                       {event.user?.name ? (
                         <span className="z-10">{initials.slice(0, 2)}</span>
                       ) : (
                         <div className="bg-gray-800 w-full h-full flex items-center justify-center opacity-50">
                           <ClockIcon className="h-4 w-4" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    </div>
                    {/* Tiny Action Badge */}
                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-lg border-2 border-gray-950 flex items-center justify-center ${colorClass} shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300`}>
                      <Icon className="h-2.5 w-2.5" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white tracking-tight truncate">
                            {event.user?.name || 'System Auto'}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-gray-700 shrink-0" />
                          <span className="text-[11px] text-gray-500 font-medium lowercase tracking-wide whitespace-nowrap">
                            {getEventTitle(event)}
                          </span>
                        </div>
                        {renderMetadata(event)}
                      </div>
                      <div className="shrink-0 text-right pt-0.5">
                        <time dateTime={event.created_at} className="block text-[10px] font-bold text-gray-600 group-hover:text-blue-500/50 transition-colors">
                           {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </time>
                        <time className="text-[10px] text-gray-700 font-medium">
                           {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
