'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowPathIcon,
  PlayIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Workflow } from '@/types/workflow';

interface WorkflowStartDialogProps {
  assetId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WorkflowStartDialog({ 
  assetId, 
  isOpen, 
  onClose,
  onSuccess 
}: WorkflowStartDialogProps) {
  const { fetchWorkflows, startWorkflow, loading } = useWorkflows();
  const { activeWorkspace } = useWorkspace();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && activeWorkspace?.id) {
      loadWorkflows();
    }
  }, [isOpen, activeWorkspace?.id]);

  const loadWorkflows = async () => {
    try {
      setFetching(true);
      const data = await fetchWorkflows(activeWorkspace?.id);
      setWorkflows(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load workflows', err);
    } finally {
      setFetching(false);
    }
  };

  const handleStart = async () => {
    if (!selectedId) return;
    try {
      await startWorkflow(assetId, selectedId);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to start workflow', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in transition-all duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-950/50">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">Start Approval Workflow</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 transition-all">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <QueueListIcon className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Workflow Template</h3>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span className="text-xs font-medium uppercase tracking-tighter">Loading templates...</span>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                <p className="text-[10px] text-gray-500 italic uppercase">No workflow templates found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workflows.map(wf => (
                  <div 
                    key={wf.id}
                    onClick={() => setSelectedId(wf.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      selectedId === wf.id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 ring-1 ring-blue-500/20'
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span>{wf.name}</span>
                      {selectedId === wf.id && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                    </div>
                    {wf.description && (
                      <p className="text-[10px] mt-1 text-gray-500 leading-relaxed line-clamp-2">
                        {wf.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-950/50 border-t border-gray-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 px-4 rounded-2xl bg-gray-800 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-700 transition-all border border-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleStart}
            disabled={loading || fetching || !selectedId}
            className="flex-3 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
            {loading ? 'Starting...' : 'Initiate Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}
