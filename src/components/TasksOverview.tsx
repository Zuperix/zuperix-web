'use client';

import React, { useEffect, useState } from 'react';
import { 
  InboxIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useWorkflows } from '@/hooks/useWorkflows';
import { WorkflowTask } from '@/types/workflow';
import WorkflowTaskCard from './WorkflowTaskCard';

export default function TasksOverview() {
  const { fetchMyTasks, loading, error } = useWorkflows();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [selectedUploader, setSelectedUploader] = useState<string>('all');

  const loadTasks = async () => {
    try {
      setFetching(true);
      const data = await fetchMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const workflows = Array.from(new Set(tasks.map(t => t.asset_workflow?.workflow?.name).filter(Boolean))) as string[];
  const uploaders = Array.from(new Set(tasks.map(t => {
      const u = t.asset_workflow?.asset?.user;
      return u?.name || null;
  }).filter(Boolean))) as string[];

  const filteredTasks = tasks.filter(task => {
    const asset = task.asset_workflow?.asset;
    const workflow = task.asset_workflow?.workflow;
    const uploader = asset?.user?.name || null;
    
    const matchesSearch = !searchQuery || 
      asset?.original_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesWorkflow = selectedWorkflow === 'all' || workflow?.name === selectedWorkflow;
    const matchesUploader = selectedUploader === 'all' || uploader === selectedUploader;
    
    return matchesSearch && matchesWorkflow && matchesUploader;
  });

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-2 border-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <InboxIcon className="h-6 w-6 text-blue-500/50" />
            </div>
        </div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scanning for tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 rounded-3xl bg-rose-600/5 border border-rose-500/20 text-center space-y-4">
        <ExclamationTriangleIcon className="h-10 w-10 text-rose-500 mx-auto" />
        <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">Connection Error</h3>
            <p className="text-xs text-rose-300/60 mt-2">{error}</p>
        </div>
        <button 
            onClick={loadTasks}
            className="px-6 py-2 rounded-xl bg-gray-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all"
        >
            Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Approval Inbox</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
            You have <span className="text-blue-500">{tasks.length} pending</span> approvals
          </p>
        </div>

        {/* Top Prominent Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 p-5 bg-gray-900/40 border border-gray-800 rounded-[32px] backdrop-blur-xl">
            <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-blue-500 transition-colors" />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by asset name..."
                    className="w-full bg-gray-950/50 border border-gray-800/50 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {uploaders.length > 0 && (
                    <div className="relative group min-w-[160px]">
                        <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-700 group-hover:text-blue-500 transition-colors shadow-sm" />
                        <select 
                            value={selectedUploader}
                            onChange={(e) => setSelectedUploader(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800/50 rounded-2xl pl-11 pr-10 py-3 text-[11px] font-bold text-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-gray-900"
                        >
                            <option value="all">Any Uploader</option>
                            {uploaders.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                )}

                {workflows.length > 0 && (
                    <div className="relative group min-w-[160px]">
                        <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-700 group-hover:text-blue-500 transition-colors" />
                        <select 
                            value={selectedWorkflow}
                            onChange={(e) => setSelectedWorkflow(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800/50 rounded-2xl pl-11 pr-10 py-3 text-[11px] font-bold text-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-gray-900"
                        >
                            <option value="all">All Workflows</option>
                            {workflows.map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                )}

                <button 
                    onClick={loadTasks}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-95 whitespace-nowrap"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-32 text-center rounded-[40px] border border-dashed border-gray-800 bg-gray-900/20 space-y-6">
          <div className="relative inline-block">
            <div className="h-20 w-20 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide uppercase">All Clear</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
              You've processed all your pending tasks. Sit back and relax!
            </p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-24 text-center rounded-3xl bg-gray-900/10 border border-gray-800 border-dashed">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest italic">No tasks match your filters</p>
            <button 
                onClick={() => { setSearchQuery(''); setSelectedWorkflow('all'); }}
                className="mt-4 text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-tighter"
            >
                Reset Filters
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <WorkflowTaskCard 
              key={task.id} 
              task={task} 
              onRefresh={loadTasks} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
