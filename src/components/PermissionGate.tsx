'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Action } from '@/types/auth';

interface PermissionGateProps {
  action: Action | string;
  subject: string;
  workspaceId?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGate component
 * Renders its children only if the user has the required permission.
 */
export function PermissionGate({
  action,
  subject,
  workspaceId,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = usePermissions();

  const isAllowed = can(action, subject, workspaceId);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
