'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeftIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  FolderIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  ArchiveBoxArrowDownIcon,
  LinkIcon,
  InformationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import googleDriveApi, { DriveConnection, DriveItem, DriveImportMode, DriveImportJob, DriveImportJobStatus } from '@/services/google-drive.api';
import { useWorkspace } from '@/context/WorkspaceContext';
import GenericConfirmationModal from '@/components/GenericConfirmationModal';
import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import { FEATURES } from '@/constants/features';

export default function GoogleDrivePage() {
  const { activeWorkspace: workspace } = useWorkspace();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<DriveConnection[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [path, setPath] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [activeJobs, setActiveJobs] = useState<DriveImportJob[]>([]);
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);
  const [importMode, setImportMode] = useState<DriveImportMode>(DriveImportMode.FULL_MIGRATION);
  const isAdvancedEnabled = useFeatureFlag(FEATURES.DRIVE_ADVANCED_MODES.key, false);

  useEffect(() => {
    if (isAdvancedEnabled) {
        setImportMode(DriveImportMode.LINK);
    } else {
        setImportMode(DriveImportMode.FULL_MIGRATION);
    }
  }, [isAdvancedEnabled]);

  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      const response = await googleDriveApi.getConnections(workspace.id);
      setConnections(response.connection ? [response.connection] : []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  }, [workspace?.id]);

  const browse = useCallback(async (folderId: string = 'root', folderName: string = 'My Drive') => {
    if (!workspace?.id) return;
    setBrowserLoading(true);
    try {
      const response = await googleDriveApi.browse(workspace.id, folderId);
      setItems([...response.folders, ...response.files]);
      
      // Update path using functional update to avoid dependency on 'path'
      setPath(prevPath => {
        if (folderId === 'root') {
          return [{ id: 'root', name: 'My Drive' }];
        }
        const index = prevPath.findIndex(p => p.id === folderId);
        if (index !== -1) {
          return prevPath.slice(0, index + 1);
        }
        return [...prevPath, { id: folderId, name: folderName }];
      });
    } catch (error: any) {
      toast.error(`Failed to browse Drive: ${error.message}`);
    } finally {
      setBrowserLoading(false);
    }
  }, [workspace?.id]);

  const refreshJobs = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      const jobs = await googleDriveApi.getActiveJobs(workspace.id);
      setActiveJobs(jobs);
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    }
  }, [workspace?.id]);

  useEffect(() => {
    if (workspace?.id) {
      Promise.all([fetchConnections(), browse(), refreshJobs()]).finally(() => setLoading(false));
    }
  }, [workspace?.id, fetchConnections, browse, refreshJobs]);

  // Handle Polling for Active Jobs
  useEffect(() => {
    const hasActiveJobs = activeJobs.some(job => 
        job.status === DriveImportJobStatus.PENDING || 
        job.status === DriveImportJobStatus.PROCESSING
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(refreshJobs, 3000);
    return () => clearInterval(interval);
  }, [activeJobs, refreshJobs]);

  // Handle OAuth Success Callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) {
      toast.success('Successfully connected to Google Drive!');
      fetchConnections();
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
    }
  }, [searchParams, fetchConnections]);

  const handleConnect = async () => {
    if (!workspace?.id) return;
    try {
      const { auth_url } = await googleDriveApi.getAuthUrl(workspace.id);
      window.location.href = auth_url;
    } catch (error: any) {
      toast.error(`Failed to start auth: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    if (!connectionToDisconnect) return;
    try {
      await googleDriveApi.disconnect(connectionToDisconnect);
      toast.success('Disconnected from Google Drive');
      fetchConnections();
      setConnectionToDisconnect(null);
      setIsDisconnectModalOpen(false);
    } catch (error: any) {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  };

  const handleStartImport = async () => {
    if (!selectedItem || !workspace?.id || !connections[0]) return;
    
    try {
      const job = await googleDriveApi.importAssets({
        connection_id: connections[0].id,
        folder_id: selectedItem.id === 'root' ? undefined : selectedItem.id,
        workspace_id: workspace.id,
        mode: importMode,
      });
      
      setActiveJobs(prev => [job, ...prev]);
      toast.success(`${importMode === 'LINK' ? 'Linking' : 'Importing'} started successfully!`);
      setSelectedItem(null);
      // Immediately refresh to get actual status
      setTimeout(refreshJobs, 500);
    } catch (error: any) {
      toast.error(`Failed to start import: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isConnected = connections.length > 0;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
        <div>
          <Link 
            href="/settings/integrations"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-4 group"
          >
            <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Integrations
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <img src="/integrations/google-drive.png" alt="Google Drive" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Google Drive</h1>
              <p className="text-gray-400">Manage your connected Drive accounts and import operations.</p>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Connect Google Drive
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Connected</span>
              <span className="text-sm font-bold text-white">{connections[0].drive_email}</span>
            </div>
            <button 
                onClick={() => {
                    setConnectionToDisconnect(connections[0].id);
                    setIsDisconnectModalOpen(true);
                }}
                className="ml-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Browser */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                {/* Navigation Breadcrumbs */}
                <div className="p-4 border-b border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {path.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2 shrink-0">
                            {i > 0 && <span className="text-gray-600">/</span>}
                            <button 
                                onClick={() => browse(p.id, p.name)}
                                className={`text-sm font-bold transition-colors ${i === path.length - 1 ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {p.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Items List */}
                <div className="min-h-[400px]">
                    {browserLoading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 gap-4">
                            <FolderIcon className="h-12 w-12 opacity-20" />
                            <p className="font-medium text-sm">This folder is empty</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800/50">
                            {items.map((item) => (
                                <div 
                                    key={item.id}
                                    className={`group flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all cursor-pointer ${item.mime_type === 'application/vnd.google-apps.folder' ? '' : 'opacity-80'}`}
                                    onClick={() => {
                                        if (item.mime_type === 'application/vnd.google-apps.folder') {
                                            browse(item.id, item.name);
                                        } else {
                                            setSelectedItem(item);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-colors`}>
                                            {item.mime_type === 'application/vnd.google-apps.folder' ? (
                                                <FolderIcon className="h-5 w-5 text-amber-400" />
                                            ) : (
                                                <DocumentIcon className="h-5 w-5 text-blue-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[300px]">
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {item.size ? (Number(item.size) / 1024 / 1024).toFixed(1) + ' MB' : 'Folder'} • Modified {new Date(item.modified_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {item.mime_type === 'application/vnd.google-apps.folder' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedItem(item);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                        >
                                            Import Folder
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Sidebar: Details & Active Jobs */}
          <div className="space-y-6">
            {/* Import Configuration */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ArchiveBoxArrowDownIcon className="h-5 w-5 text-blue-400" />
                    Import Configuration
                </h2>

                {selectedItem ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-800 rounded-lg">
                                    {selectedItem.mime_type.includes('folder') ? <FolderIcon className="h-4 w-4 text-amber-400" /> : <DocumentIcon className="h-4 w-4 text-blue-400" />}
                                </div>
                                <span className="text-sm font-bold text-white truncate">{selectedItem.name}</span>
                            </div>
                            <p className="text-[11px] text-gray-500">Selected for operation</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Mode</label>
                            {[
                                { id: DriveImportMode.LINK, name: 'Link Mode', desc: 'Zero-copy. Stream directly from Drive.', icon: LinkIcon, advanced: true },
                                { id: DriveImportMode.SMART_IMPORT, name: 'Smart Import', desc: 'Copy thumbnails, keep binary external.', icon: GlobeAltIcon, advanced: true },
                                { id: DriveImportMode.FULL_MIGRATION, name: 'Full Migration', desc: 'Download binary and terminate link.', icon: ArrowPathIcon, advanced: false },
                            ].filter(mode => !mode.advanced || isAdvancedEnabled).map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setImportMode(mode.id)}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                                        importMode === mode.id ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' : 'bg-gray-800/10 border-gray-800 hover:border-gray-700'
                                    }`}
                                >
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`p-2 rounded-xl ${importMode === mode.id ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                            <mode.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${importMode === mode.id ? 'text-white' : 'text-gray-300'}`}>{mode.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{mode.desc}</p>
                                        </div>
                                    </div>
                                    {importMode === mode.id && <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-0.5"><CheckCircleIcon className="h-4 w-4 text-white" /></div>}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleStartImport}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
                        >
                            Start Operation
                        </button>
                        
                        <button 
                            onClick={() => setSelectedItem(null)}
                            className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                        <InformationCircleIcon className="h-10 w-10 text-gray-800" />
                        <p className="text-xs text-gray-500 font-medium max-w-[200px]">
                            Select a folder or file from the browser to configure an import.
                        </p>
                    </div>
                )}
            </div>

            {/* Active Jobs Listing */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2 group flex items-center justify-between">
                    Active Operations
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-[9px]">{activeJobs.length}</span>
                </h3>
                
                {activeJobs.length === 0 ? (
                    <div className="p-8 border border-dashed border-gray-800 rounded-3xl text-center">
                        <p className="text-xs text-gray-600">No active background jobs</p>
                    </div>
                ) : (
                    activeJobs.map((job) => (
                        <div key={job.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-blue-400" />
                                    <span className="text-xs font-bold text-white capitalize">{job.mode.replace('_', ' ').toLowerCase()}</span>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                    job.status === 'COMPLETED' ? 'text-emerald-400' : 'text-blue-400 animate-pulse'
                                }`}>
                                    {job.status}
                                </span>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>Progress</span>
                                    <span>{job.total_files > 0 ? Math.round((job.processed_files / job.total_files) * 100) : 0}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full bg-blue-500 transition-all duration-1000 ${job.total_files === 0 ? 'animate-pulse' : ''}`} 
                                        style={{ width: `${job.total_files > 0 ? (job.processed_files / job.total_files) * 100 : 5}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-medium text-gray-600">
                                    <span>
                                        {job.total_files > 0 
                                            ? `${job.processed_files} / ${job.total_files} files` 
                                            : 'Calculating files...'}
                                    </span>
                                    {job.failed_files > 0 && <span className="text-red-400">{job.failed_files} failed</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Not Connected */
        <div className="bg-gray-900/40 border border-gray-800 rounded-[40px] p-20 flex flex-col items-center text-center backdrop-blur-sm relative overflow-hidden">
            <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-8 relative">
                <CloudArrowUpIcon className="h-12 w-12 text-blue-400" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full border-4 border-gray-950 flex items-center justify-center">
                    <PlusIcon className="h-4 w-4 text-white" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Integrate your Google Drive</h2>
            <p className="text-gray-400 max-w-lg leading-relaxed mb-10">
                Turn your Google Drive into a professional Asset Management system. 
                Import existing assets, link folders for zero-copy management, or perform a full migration with AI processing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
                {[
                    { title: 'Zero Copy', desc: 'Link folders without downloading binaries.', icon: LinkIcon },
                    { title: 'AI Discovery', desc: 'Auto-generate tags and embeddings.', icon: GlobeAltIcon },
                    { title: 'Full Sync', desc: 'Keep assets updated as they change.', icon: ArrowPathIcon },
                ].map((feature, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col items-center gap-3">
                        <feature.icon className="h-6 w-6 text-blue-400" />
                        <h4 className="text-sm font-bold text-white">{feature.title}</h4>
                        <p className="text-[11px] text-gray-500">{feature.desc}</p>
                    </div>
                ))}
            </div>
            <button
                onClick={handleConnect}
                className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-[24px] transition-all shadow-2xl shadow-blue-900/40 active:scale-95 uppercase tracking-widest"
            >
                Connect Now
            </button>
            
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
      )}

      {/* Modals */}
      <GenericConfirmationModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleDisconnect}
        title="Disconnect Google Drive?"
        message="Are you sure you want to disconnect? External assets will no longer be accessible until you reconnect."
        variant="danger"
        confirmText="Disconnect"
      />
    </div>
  );
}
