'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Action } from '@/types/auth';

export const PermissionGate = ({ 
  action, 
  subject, 
  workspaceId, 
  children, 
  fallback = null 
}: { 
  action: Action | string; 
  subject: string; 
  workspaceId?: string | null; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) => usePermissions().can(action, subject, workspaceId) ? <>{children}</> : <>{fallback}</>;
