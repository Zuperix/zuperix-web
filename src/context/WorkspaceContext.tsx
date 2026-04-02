'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { components } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

type Workspace = components['schemas']['CreateWorkspaceDto'] & { id: string };

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWorkspaces = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await apiFetch<Workspace[]>('/workspaces');
      setWorkspaces(data);
      if (data.length > 0 && !activeWorkspace) {
        const savedId = localStorage.getItem('active_workspace_id');
        const saved = data.find(w => w.id === savedId) || data[0];
        setActiveWorkspace(saved);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeWorkspace]);

  useEffect(() => {
    if (user?.id) {
      fetchWorkspaces();
    } else if (!user) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setLoading(false);
    }
  }, [user?.id, fetchWorkspaces]);

  const handleSetActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('active_workspace_id', workspace.id);
  };

  return (
    <WorkspaceContext.Provider 
      value={{ 
        workspaces, 
        activeWorkspace, 
        loading, 
        setActiveWorkspace: handleSetActiveWorkspace, 
        refreshWorkspaces: fetchWorkspaces 
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
