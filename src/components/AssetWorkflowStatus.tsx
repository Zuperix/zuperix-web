'use client';

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';
import { 
  AssetWorkflow, 
  AssetWorkflowStatus as WorkflowStatus, 
  WorkflowTaskStatus,
  WorkflowStage
} from '@/types/workflow';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

interface AssetWorkflowStatusProps {
  workflow: AssetWorkflow;
  onRefresh?: () => void;
}

export default function AssetWorkflowStatus({ workflow, onRefresh }: AssetWorkflowStatusProps) {
  const { processTask, loading } = useWorkflows();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [comment, setComment] = useState('');

  const stages = [...(workflow.workflow?.stages || [])].sort((a, b) => a.order - b.order);
  const currentStage = stages.find(s => s.id === workflow.current_stage_id);
  const tasks = [...(workflow.tasks || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Check if current user is an authorized approver for the active stage
  const canApprove = () => {
    if (!user || !activeWorkspace || !currentStage || workflow.status !== WorkflowStatus.ACTIVE) return false;
    
    // If no specific role required, anyone (with role) can approve? 
    // Usually we want to match the approver_role_id
    if (!currentStage.approver_role_id) return true;

    const workspaceMember = user.workspace_members?.find(m => m.workspace_id === activeWorkspace.id);
    
    return workspaceMember?.role_id === currentStage.approver_role_id || user.system_role === 'SUPER_ADMIN';
  };

  const handleAction = async (status: WorkflowTaskStatus) => {
    // Super Admins can process any task for the stage
    const activeTask = workflow.tasks?.find(t => {
      const tStageId = t.stage_id || (t as any).stageId;
      const currentStageId = workflow.current_stage_id || (workflow as any).currentStageId;
      return tStageId === currentStageId && 
             t.status === WorkflowTaskStatus.PENDING &&
             (user?.system_role === 'SUPER_ADMIN' || (t.user_id || (t as any).userId) === user?.id);
    }) || workflow.tasks?.find(t => {
      const tStageId = t.stage_id || (t as any).stageId;
      const currentStageId = workflow.current_stage_id || (workflow as any).currentStageId;
      return tStageId === currentStageId && t.status === WorkflowTaskStatus.PENDING;
    });

    if (!activeTask) {
        toast.error('No active task found for this stage');
        return;
    }

    try {
      await processTask(activeTask.id, status, comment);
      toast.success(status === WorkflowTaskStatus.APPROVED ? 'Stage approved' : 'Workflow rejected');
      setComment('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
      if (onRefresh) onRefresh();
    }
  };

  const getStageStatus = (stageId: string, order: number) => {
    if (workflow.status === WorkflowStatus.REJECTED && stageId === workflow.current_stage_id) return 'rejected';
    if (workflow.status === WorkflowStatus.COMPLETED) {
        // If completed but no task exists for this stage, it was skipped
        if (!tasks.some(t => t.stage_id === stageId)) return 'skipped';
        return 'completed';
    }

    if (!currentStage) return 'pending';
    
    if (order < currentStage.order) {
        // If past current stage but no task exists, it was skipped
        if (!tasks.some(t => t.stage_id === stageId)) return 'skipped';
        return 'completed';
    }
    
    if (order === currentStage.order) return 'active';
    return 'pending';
  };

  return (
    <div className="flex flex-col h-full space-y-8 pb-10">
      {/* Header Summary */}
      <div className="flex items-center justify-between p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-3 rounded-2xl border-2 ${
            workflow.status === WorkflowStatus.ACTIVE ? 'bg-blue-600 border-blue-400/50 text-white shadow-lg shadow-blue-500/20 animate-pulse' :
            workflow.status === WorkflowStatus.COMPLETED ? 'bg-emerald-600 border-emerald-400/50 text-white shadow-lg shadow-emerald-500/20' :
            'bg-rose-600 border-rose-400/50 text-white shadow-lg shadow-rose-500/20'
          }`}>
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Approval Workflow</h4>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white leading-none">{workflow.workflow?.name}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                    workflow.status === WorkflowStatus.ACTIVE ? 'bg-blue-500/20 text-blue-400' :
                    workflow.status === WorkflowStatus.COMPLETED ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/20 text-rose-400'
                }`}>
                    {workflow.status}
                </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Column: Vertical Stepper */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Pipeline Progress</h3>
            <div className="relative pl-6">
                <div className="absolute left-[37px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/50 via-gray-800 to-gray-800/20 z-0" />
                
                <div className="space-y-12 relative">
                {stages.map((stage, idx) => {
                    const status = getStageStatus(stage.id, stage.order);
                    
                    return (
                    <div key={stage.id} className="flex gap-8 items-start group">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                                status === 'completed' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' :
                                status === 'skipped' ? 'bg-gray-800 border-gray-700 text-gray-400 opacity-60' :
                                status === 'active' ? 'bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-500/40 scale-110' :
                                status === 'rejected' ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30' :
                                'bg-gray-900 border-gray-800 text-gray-600'
                            }`}>
                                {status === 'completed' ? <CheckCircleIcon className="h-6 w-6" /> :
                                status === 'skipped' ? <ArrowPathIcon className="h-5 w-5 rotate-90" /> :
                                status === 'rejected' ? <ExclamationCircleIcon className="h-6 w-6" /> :
                                <span className="text-xs font-bold font-mono">{idx + 1}</span>}
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h5 className={`text-sm font-bold tracking-tight transition-colors ${
                                        status === 'active' ? 'text-white' : 'text-gray-500'
                                    }`}>
                                        {stage.name}
                                    </h5>
                                    <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest mt-0.5">
                                        Approver Role: {activeWorkspace?.id ? (stage.approver_role_id || 'Anyone') : '...'}
                                    </p>
                                </div>
                                {status === 'active' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Current</span>
                                    </div>
                                )}
                                {status === 'skipped' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Skipped</span>
                                    </div>
                                )}
                            </div>
                            
                            {status === 'active' && canApprove() && (
                                <div className="mt-4 p-5 rounded-3xl bg-gray-800/50 border border-blue-500/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Your Approval Required</span>
                                    </div>
                                    <textarea 
                                        className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl p-4 text-xs text-white focus:ring-1 focus:ring-blue-500/40 outline-none resize-none min-h-[80px] placeholder:text-gray-700"
                                        placeholder="Add an optional comment..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleAction(WorkflowTaskStatus.APPROVED)}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                                            Approve Step
                                        </button>
                                        <button 
                                            onClick={() => handleAction(WorkflowTaskStatus.REJECTED)}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600 text-rose-500 hover:text-white disabled:opacity-50 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <XMarkIcon className="h-4 w-4" />}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )}

                            {status === 'active' && !canApprove() && (
                                <div className="mt-4 p-4 rounded-2xl bg-gray-950/30 border border-gray-800 flex items-center gap-3">
                                    <ClockIcon className="h-4 w-4 text-gray-600" />
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                                        Waiting for {stage.required_approvals} approval{stage.required_approvals > 1 ? 's' : ''} from authorized reviewers.
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

        {/* Right Column: Audit Log */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col min-h-0">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Action Log</h3>
            <div className="flex-1 bg-gray-950/40 rounded-[32px] border border-gray-800 p-6 overflow-y-auto custom-scrollbar">
                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task.id} className="p-4 bg-gray-900/60 border border-gray-800/50 rounded-2xl hover:border-gray-700 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <UserCircleIcon className="h-4 w-4 text-gray-600" />
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Approver</span>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                                        task.status === WorkflowTaskStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-500' :
                                        task.status === WorkflowTaskStatus.REJECTED ? 'bg-rose-500/10 text-rose-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        {task.status}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-bold text-gray-100">{task.stage?.name || 'Unknown Stage'}</span>
                                    {task.comment && (
                                        <div className="flex gap-2 p-2.5 bg-gray-950/50 rounded-xl mt-1 border border-gray-800/50">
                                            <ChatBubbleLeftRightIcon className="h-3 w-3 text-gray-600 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-gray-400 leading-relaxed italic">{task.comment}</p>
                                        </div>
                                    )}
                                    <span className="text-[9px] text-gray-600 mt-1 font-medium">{new Date(task.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
                        <ArrowPathIcon className="h-8 w-8 text-gray-800 mb-2" />
                        <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em]">Log Empty</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function XMarkIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
