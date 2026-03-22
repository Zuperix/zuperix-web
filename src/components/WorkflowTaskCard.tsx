'use client';

import React, { useState } from 'react';
import { 
  CheckIcon, 
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { WorkflowTask, WorkflowTaskStatus } from '@/types/workflow';
import { useWorkflows } from '@/hooks/useWorkflows';

interface WorkflowTaskCardProps {
  task: WorkflowTask;
  onRefresh?: () => void;
}

export default function WorkflowTaskCard({ task, onRefresh }: WorkflowTaskCardProps) {
  const { processTask, loading } = useWorkflows();
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);

  const handleAction = async (status: WorkflowTaskStatus) => {
    try {
      await processTask(task.id, status, comment || undefined);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to process task', err);
    }
  };

  const asset = task.asset_workflow?.asset;
  const workflow = task.asset_workflow?.workflow;
  const stage = task.stage;

  return (
    <div className="group relative bg-gray-900/40 border border-gray-800 hover:border-blue-500/30 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-6 relative">
        <div className="flex items-start gap-4">
          {/* Asset Preview Placeholder */}
          <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-500/20 transition-all">
             {asset?.thumbnail_url ? (
               <img src={asset.thumbnail_url} className="w-full h-full object-cover" />
             ) : (
               <DocumentIcon className="h-8 w-8 text-gray-600 group-hover:text-blue-500 transition-colors" />
             )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-gray-800 text-[9px] font-bold text-gray-400 border border-gray-700 uppercase tracking-tighter">
                    {workflow?.name}
                </span>
                <ChevronRightIcon className="h-3 w-3 text-gray-700" />
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
                    {stage?.name}
                </span>
            </div>
            
            <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {asset?.name || 'Untitled Asset'}
            </h3>
            
            <p className="text-[10px] text-gray-500 font-mono mt-1">
                ID: {asset?.id?.split('-')[0]}...
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
            {showComment ? (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a reason for your decision (optional)..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs text-gray-300 placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all min-h-[80px]"
                    />
                    <button 
                        onClick={() => setShowComment(false)}
                        className="text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-tighter transition-colors"
                    >
                        Hide Comment Field
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setShowComment(true)}
                    className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-blue-400 uppercase tracking-tighter transition-colors"
                >
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                    Add a comment
                </button>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => handleAction(WorkflowTaskStatus.REJECTED)}
                    disabled={loading}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-950/50 border border-gray-800 text-rose-500 hover:bg-rose-600/10 hover:border-rose-500/50 font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    Reject
                </button>
                <button
                    onClick={() => handleAction(WorkflowTaskStatus.APPROVED)}
                    disabled={loading}
                    className="flex-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <CheckIcon className="h-4 w-4" />
                    Approve
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}
