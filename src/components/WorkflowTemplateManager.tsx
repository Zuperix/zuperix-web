'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  QueueListIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useWorkflows } from '@/hooks/useWorkflows';
import { Workflow, WorkflowStage } from '@/types/workflow';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
}

export default function WorkflowTemplateManager() {
  const { fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, addStage, updateStage, deleteStage, loading } = useWorkflows();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [fetching, setFetching] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [expandedWfId, setExpandedWfId] = useState<string | null>(null);
  
  const { activeWorkspace } = useWorkspace();
  const [newWf, setNewWf] = useState({ name: '', description: '' });

  const loadData = async () => {
    try {
      setFetching(true);
      if (!activeWorkspace?.id) return [];
      const [wfData, roleData] = await Promise.all([
        fetchWorkflows(activeWorkspace.id),
        apiFetch<Role[]>('/roles')
      ]);
      setWorkflows(wfData);
      setRoles(roleData);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadData();
    }
  }, [activeWorkspace?.id]);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) {
      toast.error('No active workspace selected');
      return;
    }
    try {
      await createWorkflow({ ...newWf, workspace_id: activeWorkspace.id });
      toast.success('Workflow template created');
      setIsCreating(false);
      setNewWf({ name: '', description: '' });
      loadData();
    } catch (err) {
      toast.error('Failed to create workflow');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow template?')) return;
    try {
      await deleteWorkflow(id);
      toast.success('Workflow deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleAddStage = async (workflowId: string) => {
    try {
      const order = (workflows.find(w => w.id === workflowId)?.stages?.length || 0) + 1;
      await addStage(workflowId, {
        name: `Stage ${order}`,
        order: order,
        required_approvals: 1
      });
      loadData();
    } catch (err) {
      toast.error('Failed to add stage');
    }
  };

  const handleSaveAll = async (workflowId: string) => {
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf || !wf.stages) return;

    try {
      // In a real production app, we'd have a batch update endpoint.
      // For now, we'll update all stages and then refresh once.
      const updatePromises = wf.stages.map(stage => 
        updateStage(stage.id, {
          name: stage.name,
          approver_role_id: stage.approver_role_id,
          required_approvals: stage.required_approvals
        })
      );
      
      await Promise.all(updatePromises);
      toast.success('All changes saved successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to save some changes');
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      await deleteStage(stageId);
      loadData();
    } catch (err) {
      toast.error('Failed to delete stage');
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading Workflows</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest"
        >
          <PlusIcon className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateWorkflow}>
              <div className="p-8 border-b border-gray-800 bg-gray-950/50">
                <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest">New Workflow Template</h2>
                <p className="text-xs text-gray-500 mt-1">Provide a name and description for your approval pipeline.</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Template Name</label>
                  <input
                    type="text"
                    required
                    value={newWf.name}
                    onChange={(e) => setNewWf({ ...newWf, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="e.g. Legal & Marketing Review"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea
                    value={newWf.description}
                    onChange={(e) => setNewWf({ ...newWf, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[100px]"
                    placeholder="Detail the purpose of this workflow..."
                  />
                </div>
              </div>
              <div className="p-8 bg-gray-950/50 flex items-center justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest"
                >
                  {loading ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {workflows.map((wf) => (
          <div 
            key={wf.id} 
            className="group bg-gray-900/40 border border-gray-800 hover:border-blue-500/30 rounded-[32px] overflow-hidden transition-all duration-300"
          >
            <div className={`p-8 flex items-center justify-between cursor-pointer ${expandedWfId === wf.id ? 'bg-gray-800/20' : ''}`} onClick={() => setExpandedWfId(expandedWfId === wf.id ? null : wf.id)}>
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <QueueListIcon className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{wf.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xl">{wf.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stages</span>
                    <span className="text-lg font-mono font-bold text-white leading-none mt-1">{wf.stages?.length || 0}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }}
                  className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <div className="text-gray-600">
                  {expandedWfId === wf.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </div>
              </div>
            </div>

            {expandedWfId === wf.id && (
              <div className="p-8 border-t border-gray-800 animate-in slide-in-from-top-4 duration-300">
                <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    How it works
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                    This template defines an <strong>approval pipeline</strong>. When started, the asset moves through these steps in order. 
                    Each step restricts editing and requires the specified role to approve it.
                  </p>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Configured Pipeline Stages</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleSaveAll(wf.id)}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                    >
                      {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                      Save All Changes
                    </button>
                    <button
                      onClick={() => handleAddStage(wf.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-black/20 border border-gray-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add New Step
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {[...(wf.stages || [])].sort((a,b) => a.order - b.order).map((stage, idx) => (
                    <div key={stage.id} className="relative pl-12">
                        {/* Connection Line */}
                        {idx < (wf.stages?.length || 0) - 1 && (
                            <div className="absolute left-6 top-10 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-transparent z-0" />
                        )}
                        
                        <div className="absolute left-0 top-1 flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black text-blue-500/40 uppercase tracking-widest">Step</span>
                            <div className="h-10 w-10 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center z-10 font-mono font-bold text-blue-400 text-xs shadow-2xl">
                                {idx + 1}
                            </div>
                        </div>

                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-wrap lg:flex-nowrap items-center gap-6 group/stage relative hover:border-blue-500/20 transition-all">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Stage Name</label>
                                <input 
                                    type="text"
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-white placeholder:text-gray-700 focus:ring-0"
                                    value={stage.name || ''}
                                    onChange={(e) => {
                                      const newName = e.target.value;
                                      setWorkflows(prev => prev.map(w => {
                                        if (w.id !== wf.id) return w;
                                        return {
                                          ...w,
                                          stages: w.stages?.map(s => s.id === stage.id ? { ...s, name: newName } : s)
                                        };
                                      }));
                                    }}
                                    placeholder="Enter stage name..."
                                />
                            </div>

                            <div className="w-full lg:w-48 shrink-0">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Approver Role</label>
                                <select 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                                    value={stage.approver_role_id || ''}
                                    onChange={(e) => {
                                      const newRoleId = e.target.value;
                                      setWorkflows(prev => prev.map(wf => ({
                                        ...wf,
                                        stages: wf.stages?.map(s => s.id === stage.id ? { ...s, approver_role_id: newRoleId } : s)
                                      })));
                                    }}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>

                            <div className="w-24 shrink-0">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Min Approvals</label>
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-center"
                                    value={stage.required_approvals}
                                    onChange={(e) => {
                                      const newVal = parseInt(e.target.value) || 1;
                                      setWorkflows(prev => prev.map(wf => ({
                                        ...wf,
                                        stages: wf.stages?.map(s => s.id === stage.id ? { ...s, required_approvals: newVal } : s)
                                      })));
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <button 
                                    onClick={() => handleDeleteStage(stage.id)}
                                    className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                  ))}

                  {(wf.stages || []).length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center bg-gray-950/30 border-2 border-dashed border-gray-800 rounded-[32px]">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Define your first approval stage</p>
                        <button
                            onClick={() => handleAddStage(wf.id)}
                            className="mt-6 px-10 py-3 bg-blue-600/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-2xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest shadow-xl shadow-blue-900/10"
                        >
                            + Quick Add Stage
                        </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {workflows.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center bg-gray-900/20 border-2 border-dashed border-gray-800/60 rounded-[48px]">
                <div className="h-20 w-20 bg-gray-800/50 rounded-[32px] flex items-center justify-center mb-8">
                    <QueueListIcon className="h-10 w-10 text-gray-700" />
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em] mb-3">No Templates Detected</h3>
                <p className="text-xs text-gray-600 font-medium opacity-60">Begin by creating a new reusable workflow template.</p>
            </div>
        )}
      </div>
    </div>
  );
}
