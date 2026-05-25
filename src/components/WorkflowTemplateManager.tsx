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
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useCategories, Category } from '@/hooks/useCategories';
import { useMetadataFields, MetadataField } from '@/hooks/useMetadataFields';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Workflow, WorkflowStage } from '@/types/workflow';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface Role {
  id: string;
  name: string;
}

export default function WorkflowTemplateManager() {
  const { activeWorkspace } = useWorkspace();
  const { categories } = useCategories();
  const { fields: metadataFields } = useMetadataFields(activeWorkspace?.id || '');
  const { 
    loading, 
    fetchWorkflows,
    createWorkflow, 
    updateWorkflow, 
    deleteWorkflow, 
    addStage, 
    updateStage, 
    deleteStage 
  } = useWorkflows();
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [expandedWfId, setExpandedWfId] = useState<string | null>(null);
  const [newWf, setNewWf] = useState({ name: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ 
    type: 'workflow' | 'stage'; 
    id: string; 
    name?: string; 
    workflowId?: string;
  } | null>(null);
  const [deletedStageIds, setDeletedStageIds] = useState<string[]>([]);

  const loadData = async (keepLocalChanges = true) => {
    try {
      setIsFetching(true);
      if (!activeWorkspace?.id) return [];
      const [wfData, roleData] = await Promise.all([
        fetchWorkflows(activeWorkspace.id),
        apiFetch<Role[]>('/roles')
      ]);
      
      setRoles(roleData || []);
      
      if (!keepLocalChanges) {
        setDeletedStageIds([]);
      }

      if (keepLocalChanges) {
        setWorkflows(prev => {
          if (!prev || prev.length === 0) return wfData;
          return wfData.map(newWf => {
            const localWf = prev.find(w => w.id === newWf.id);
            if (!localWf) return newWf;

            const mergedStages = (newWf.stages || []).map(newStage => {
              const localStage = localWf.stages?.find(s => s.id === newStage.id);
              if (!localStage) return newStage;
              return {
                ...newStage,
                name: localStage.name,
                approver_role_id: localStage.approver_role_id,
                required_approvals: localStage.required_approvals,
                conditions: localStage.conditions
              };
            });

            return {
              ...newWf,
              conditions: localWf.conditions,
              stages: mergedStages
            };
          });
        });
      } else {
        setWorkflows(wfData);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadData(false);
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

  const handleDeleteWorkflow = (id: string, name: string) => {
    setDeleteTarget({ type: 'workflow', id, name });
  };

  const handleAddStage = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id !== workflowId) return w;
      const order = (w.stages?.length || 0) + 1;
      const newStage = {
        id: `temp-${Date.now()}`,
        name: `Stage ${order}`,
        order: order,
        required_approvals: 1,
        workflow_id: workflowId,
        conditions: { all: [], any: [] }
      };
      return {
        ...w,
        stages: [...(w.stages || []), newStage]
      };
    }));
  };

  const handleUpdateWorkflowConditions = (workflowId: string, conditions: any) => {
    setWorkflows(prev => prev.map(w => w.id === workflowId ? { ...w, conditions } : w));
  };

  const handleSaveAll = async (workflowId: string) => {
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf) return;

    const missingRoleStage = (wf.stages || []).find(s => !s.approver_role_id);
    if (missingRoleStage) {
      toast.error(`Please select an Approver Role for all pipeline stages (missing in "${missingRoleStage.name}")`);
      return;
    }

    try {
      // 1. Update workflow-level stuff first
      await updateWorkflow(workflowId, {
        name: wf.name,
        description: wf.description,
        conditions: wf.conditions
      });

      // 2. Perform deletes for stages removed from this workflow
      const deletes = deletedStageIds.map(stageId => deleteStage(stageId));
      await Promise.all(deletes);

      // 3. Add or Update stages
      const savePromises = (wf.stages || []).map(stage => {
        const stageData = {
          name: stage.name,
          approver_role_id: stage.approver_role_id || null,
          required_approvals: stage.required_approvals,
          order: stage.order,
          conditions: stage.conditions
        };
        if (stage.id.startsWith('temp-')) {
          return addStage(workflowId, stageData);
        } else {
          return updateStage(stage.id, stageData);
        }
      });
      
      await Promise.all(savePromises);
      toast.success('All changes saved successfully');
      loadData(false);
    } catch (err) {
      toast.error('Failed to save some changes');
    }
  };

  const handleDeleteStage = (workflowId: string, stageId: string, name: string) => {
    setDeleteTarget({ type: 'stage', id: stageId, name, workflowId });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'workflow') {
      try {
        await deleteWorkflow(deleteTarget.id);
        toast.success('Workflow template deleted successfully');
        loadData(true);
      } catch (err) {
        toast.error('Failed to delete workflow');
      } finally {
        setDeleteTarget(null);
      }
    } else {
      const { id: stageId, workflowId } = deleteTarget;
      if (stageId && workflowId) {
        if (!stageId.startsWith('temp-')) {
          setDeletedStageIds(prev => [...prev, stageId]);
        }
        setWorkflows(prev => prev.map(w => {
          if (w.id !== workflowId) return w;
          const filtered = (w.stages || []).filter(s => s.id !== stageId);
          const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
          return {
            ...w,
            stages: reordered
          };
        }));
        toast.success('Stage removed locally. Click Save All Changes to commit.');
      }
      setDeleteTarget(null);
    }
  };

  if (isFetching && workflows.length === 0) {
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
                  onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id, wf.name); }}
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

                {/* GLOBAL WORKFLOW TRIGGER CONDITIONS */}
                <div className="mb-10">
                  <ConditionBuilder 
                    title="Workflow Trigger Conditions"
                    conditions={wf.conditions}
                    onChange={(newConds) => handleUpdateWorkflowConditions(wf.id, newConds)}
                    metadataFields={metadataFields}
                    categories={categories}
                  />
                  <p className="text-[10px] text-gray-500 mt-3 ml-2 italic">
                    Assets matching these rules will automatically enter this workflow. If multiple workflows match, the first one created takes priority.
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

                            {/* Optional: Small indicator if stage has its own conditions */}
                            {stage.conditions && (stage.conditions.all?.length > 0 || stage.conditions.any?.length > 0) && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <ArrowPathIcon className="h-3 w-3 text-blue-400" />
                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Conditional Stage</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 ml-auto">
                                <button 
                                    onClick={() => handleDeleteStage(wf.id, stage.id, stage.name || `Stage ${idx + 1}`)}
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
      <DeleteConfirmationModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === 'workflow' ? 'Template' : 'Stage'}?`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete permanently"
        isDeleting={loading}
      />
    </div>
  );
}

interface ConditionBuilderProps {
  conditions: any;
  onChange: (conditions: any) => void;
  metadataFields: MetadataField[];
  categories: Category[];
  title?: string;
}

function ConditionBuilder({ conditions, onChange, metadataFields, categories, title = "Smart Routing Logic" }: ConditionBuilderProps) {
  const rules = conditions?.all || conditions?.any || [];
  const logicKey = conditions?.any ? 'any' : 'all';

  const addRule = () => {
    const newCond = { field: 'size', operator: 'eq', value: '' };
    onChange({ [logicKey]: [...rules, newCond] });
  };

  const removeRule = (idx: number) => {
    onChange({ [logicKey]: rules.filter((_: any, i: number) => i !== idx) });
  };

  const updateRule = (idx: number, updates: any) => {
    onChange({ [logicKey]: rules.map((c: any, i: number) => i === idx ? { ...c, ...updates } : c) });
  };

  const toggleLogic = (key: 'all' | 'any') => {
    onChange({ [key]: rules });
  };

  return (
    <div className="flex flex-col gap-4 bg-gray-950/40 p-6 rounded-[32px] border border-gray-800/60 shadow-inner relative overflow-hidden group/smart">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover/smart:bg-blue-500/10 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-2 relative z-10">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <ArrowPathIcon className="h-3.5 w-3.5 text-blue-400" />
          </div>
          {title}
          <span className="text-[8px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 ml-1 shadow-sm">BETA</span>
        </label>

        <div className="flex p-1 bg-gray-900/80 rounded-xl border border-gray-800 shadow-sm">
          <button 
            type="button"
            onClick={() => toggleLogic('all')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
              logicKey === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            AND
          </button>
          <button 
            type="button"
            onClick={() => toggleLogic('any')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
              logicKey === 'any' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            OR
          </button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {rules.length > 0 ? (
          <div className="space-y-3">
            {rules.map((cond: any, cidx: number) => (
              <div key={cidx} className="bg-gray-900/50 backdrop-blur-md border border-gray-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all group/rule relative shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${logicKey === 'any' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rule #{cidx + 1}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeRule(cidx)}
                      className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover/rule:opacity-100"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 space-y-1.5">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Factor</label>
                      <select 
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-300 focus:ring-1 focus:ring-blue-500/50 outline-none hover:bg-gray-900 transition-colors cursor-pointer"
                        value={cond.field}
                        onChange={(e) => updateRule(cidx, { field: e.target.value, value: '' })}
                      >
                        <optgroup label="System Factors" className="text-gray-500 bg-gray-950">
                          <option value="size">File Size</option>
                          <option value="mime_type">Media Type</option>
                          <option value="extension">Extension</option>
                          <option value="category_ids">Category</option>
                        </optgroup>
                        {metadataFields.length > 0 && (
                          <optgroup label="Metadata Fields" className="text-gray-500 bg-gray-950">
                            {metadataFields.map(f => (
                              <option key={f.id} value={`metadata.${f.key}`}>Meta: {f.label}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Logic</label>
                      <select 
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-[11px] font-bold text-blue-400 focus:ring-1 focus:ring-blue-500/50 outline-none hover:bg-gray-900 transition-colors cursor-pointer text-center appearance-none"
                        value="eq"
                        disabled
                      >
                        <option value="eq">Matches</option>
                      </select>
                    </div>

                    <div className="col-span-5 space-y-1.5">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Expected Value</label>
                      {cond.field === 'category_ids' ? (
                        <select 
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-[11px] font-bold text-white focus:ring-1 focus:ring-blue-500/50 outline-none hover:bg-gray-900 transition-colors cursor-pointer"
                          value={cond.value}
                          onChange={(e) => updateRule(cidx, { value: e.target.value })}
                        >
                          <option value="">Select Category...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.path}</option>
                          ))}
                        </select>
                      ) : cond.field === 'mime_type' ? (
                        <select 
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-[11px] font-bold text-white focus:ring-1 focus:ring-blue-500/50 outline-none hover:bg-gray-900 transition-colors cursor-pointer"
                          value={cond.value}
                          onChange={(e) => updateRule(cidx, { value: e.target.value })}
                        >
                          <option value="">Select Media Type...</option>
                          <option value="image/jpeg">JPEG Image</option>
                          <option value="image/png">PNG Image</option>
                          <option value="image/gif">GIF Image</option>
                          <option value="video/mp4">MP4 Video</option>
                          <option value="application/pdf">PDF Document</option>
                        </select>
                      ) : cond.field.startsWith('metadata.') && metadataFields.find(f => `metadata.${f.key}` === cond.field)?.options?.values ? (
                        <select 
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-[11px] font-bold text-white focus:ring-1 focus:ring-blue-500/50 outline-none hover:bg-gray-900 transition-colors cursor-pointer"
                          value={cond.value}
                          onChange={(e) => updateRule(cidx, { value: e.target.value })}
                        >
                          <option value="">Select Option...</option>
                          {metadataFields.find(f => `metadata.${f.key}` === cond.field)?.options.values.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text"
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-[11px] font-bold text-white focus:ring-1 focus:ring-blue-500/50 outline-none placeholder:text-gray-800"
                          value={cond.value}
                          placeholder="e.g. .jpg, image/png, or 1048576"
                          onChange={(e) => updateRule(cidx, { value: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center bg-gray-900 border-2 border-dashed border-gray-800 rounded-[28px] group-hover/smart:border-blue-500/20 transition-all">
            <div className="p-3 rounded-2xl bg-gray-800/50 mb-3 border border-gray-700/50">
              <ShieldCheckIcon className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center px-6">
              No routing rules defined.<br/>
              <span className="text-[9px] font-medium opacity-60">This stage will run for every upload.</span>
            </p>
          </div>
        )}
        
        <button 
          type="button"
          onClick={addRule}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98] border border-blue-400/20 flex items-center justify-center gap-2.5"
        >
          <PlusIcon className="h-4 w-4" />
          Add Condition Rule
        </button>
      </div>
    </div>
  );
}
