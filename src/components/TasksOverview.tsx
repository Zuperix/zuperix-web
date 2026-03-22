'use client';

import React, { useEffect, useState } from 'react';
import { 
  InboxIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useWorkflows } from '@/hooks/useWorkflows';
import { WorkflowTask } from '@/types/workflow';
import WorkflowTaskCard from './WorkflowTaskCard';

export default function TasksOverview() {
  const { fetchMyTasks, loading, error } = useWorkflows();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [fetching, setFetching] = useState(true);

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
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Approval Inbox</h2>
          <p className="text-xs text-secondary-text mt-1">
            You have <span className="text-blue-400 font-bold">{tasks.length} pending</span> approval requests
          </p>
        </div>
        <button 
          onClick={loadTasks}
          className="p-3 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center gap-2 group"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Refresh</span>
        </button>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
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
