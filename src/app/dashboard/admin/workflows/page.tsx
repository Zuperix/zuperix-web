'use client';

import WorkflowTemplateManager from '@/components/WorkflowTemplateManager';
import { QueueListIcon } from '@heroicons/react/24/outline';

export default function WorkflowsAdminPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <QueueListIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Workflow Management</h1>
            <p className="text-sm text-gray-500">Create and manage approval pipelines for your assets.</p>
          </div>
        </div>
      </div>

      <WorkflowTemplateManager />
    </div>
  );
}
