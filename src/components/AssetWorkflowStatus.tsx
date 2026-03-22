'use client';

import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import { AssetWorkflow, AssetWorkflowStatus as WorkflowStatus, WorkflowTaskStatus } from '@/types/workflow';

interface AssetWorkflowStatusProps {
  workflow: AssetWorkflow;
}

export default function AssetWorkflowStatus({ workflow }: AssetWorkflowStatusProps) {
  const stages = workflow.workflow?.stages?.sort((a, b) => a.order - b.order) || [];
  const currentStage = stages.find(s => s.id === workflow.current_stage_id);

  const getStageStatus = (stageId: string, order: number) => {
    if (workflow.status === WorkflowStatus.REJECTED) return 'rejected';
    if (workflow.status === WorkflowStatus.COMPLETED) return 'completed';

    if (!currentStage) return 'pending';
    if (order < currentStage.order) return 'completed';
    if (order === currentStage.order) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            workflow.status === WorkflowStatus.ACTIVE ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' :
            workflow.status === WorkflowStatus.COMPLETED ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' :
            'bg-rose-600/10 border-rose-500/30 text-rose-400'
          }`}>
            <ClockIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Workflow</h4>
            <p className="text-sm font-bold text-white selection:bg-blue-500/30">{workflow.workflow?.name}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
          workflow.status === WorkflowStatus.ACTIVE ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' :
          workflow.status === WorkflowStatus.COMPLETED ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' :
          'bg-rose-600/10 border-rose-500/30 text-rose-400'
        }`}>
          {workflow.status}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-800" />
        
        <div className="space-y-8 relative">
          {stages.map((stage) => {
            const status = getStageStatus(stage.id, stage.order);
            
            return (
              <div key={stage.id} className="flex gap-4 items-start group">
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    status === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                    status === 'active' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' :
                    status === 'rejected' ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' :
                    'bg-gray-900 border-gray-800 text-gray-600'
                  }`}>
                    {status === 'completed' ? <CheckCircleIcon className="h-5 w-5" /> :
                     status === 'rejected' ? <ExclamationCircleIcon className="h-5 w-5" /> :
                     <span className="text-[10px] font-bold font-mono">{stage.order}</span>}
                  </div>
                </div>

                <div className="flex-1 py-1">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                      status === 'active' ? 'text-white' : 'text-gray-500'
                    }`}>
                      {stage.name}
                    </h5>
                    {status === 'active' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Current Step</span>
                        </div>
                    )}
                  </div>
                  
                  {status === 'active' && (
                    <div className="mt-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
                        <p className="text-[10px] text-gray-400 leading-relaxed italic">
                            Waiting for {stage.required_approvals} approval{stage.required_approvals > 1 ? 's' : ''} from users with authorized roles.
                        </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
