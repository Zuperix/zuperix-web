'use client';

import WorkflowTemplateManager from '@/components/WorkflowTemplateManager';
import { QueueListIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

/**
 * Workflow Settings Page
 * Relocated from admin section to settings dashboard for better accessibility.
 */
export default function WorkflowsSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/settings"
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
