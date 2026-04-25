'use client';

import { usePermissions, SystemRole } from '@/hooks/usePermissions';
import { 
  ChevronLeftIcon,
  CloudArrowUpIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { googleDriveApi } from '@/services/google-drive.api';

const INTEGRATIONS_CONFIG = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Import or link files directly from your Google Drive without duplicating data.',
    icon: '/integrations/google-drive.png',
    status: 'Ready',
    href: '/settings/integrations/google-drive',
    enabled: true,
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Mount S3 buckets as external storage for zero-copy management.',
    icon: '/integrations/aws-s3.svg',
    status: 'Coming Soon',
    href: '#',
    enabled: false,
  }
];

export default function IntegrationsPage() {
  const { user } = usePermissions();
  const { activeWorkspace: workspace } = useWorkspace();
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspace?.id) {
      googleDriveApi.getConnections(workspace.id)
        .then(res => setIsDriveConnected(!!res.connection))
        .catch(err => console.error('Failed to check Drive connection:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [workspace?.id]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link 
        href="/settings"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
      >
        <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <CloudArrowUpIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">External Integrations</h1>
              <p className="text-gray-400">Connect external data sources to sync and manage your assets.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS_CONFIG.map((integration) => {
          const isConnected = integration.id === 'google-drive' && isDriveConnected;
          
          return (
            <div 
              key={integration.id}
              className={`group p-8 bg-gray-900/40 border border-gray-800 rounded-3xl transition-all duration-300 flex flex-col justify-between gap-8 relative overflow-hidden ${integration.enabled ? 'hover:bg-gray-800/60 hover:border-gray-700' : 'opacity-60 grayscale'}`}
            >
              <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-4">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center p-3 border border-white/5">
                          <img src={integration.icon} alt={integration.name} className="w-10 h-10 object-contain" />
                      </div>
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                            {isConnected && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-tighter rounded-md border border-emerald-500/20">
                                <CheckCircleIcon className="h-3 w-3" />
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">
                              {integration.description}
                          </p>
                      </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      integration.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'
                  }`}>
                      {integration.status}
                  </div>
              </div>

              {integration.enabled ? (
                  <Link
                      href={integration.href}
                      className={`w-full py-4 font-bold text-sm rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                        isConnected 
                          ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20'
                      }`}
                  >
                      {isConnected ? 'Manage' : 'Configure'}
                      {isConnected ? <Cog6ToothIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  </Link>
              ) : (
                  <button
                      disabled
                      className="w-full py-4 bg-gray-800 text-gray-500 font-bold text-sm rounded-2xl cursor-not-allowed"
                  >
                      Coming Soon
                  </button>
              )}

              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
