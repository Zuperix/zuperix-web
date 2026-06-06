'use client';

import { useWorkspace } from '@/context/WorkspaceContext';
import { usePermissions, SystemRole } from '@/hooks/usePermissions';
import { Action } from '@/types/auth';
import WorkflowTemplateManager from '@/components/WorkflowTemplateManager';
import { QueueListIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

/**
 * Workflow Settings Page
 * Relocated from admin section to settings dashboard for better accessibility.
 */
export default function WorkflowsSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const { can, user } = usePermissions();

  const isSuperAdmin = user?.system_role === SystemRole.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || can(Action.Manage, 'Workspace', activeWorkspace?.id);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center max-w-md mx-auto px-4 animate-in fade-in duration-500">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full">
          <QueueListIcon className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Access Denied</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            You do not have permission to manage workflows in this workspace. Please contact your workspace administrator for access.
          </p>
        </div>
        <Link
          href="/settings"
          className="px-6 py-3 bg-gray-900 border border-gray-800 text-gray-300 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link 
            href="/settings"
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <QueueListIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Workflow Management</h1>
            <p className="text-sm text-gray-500">Create and manage approval pipelines for your assets.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-950/40 border border-gray-800/60 rounded-3xl p-6 backdrop-blur-xl">
        <WorkflowTemplateManager />
      </div>
    </div>
  );
}
