'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Action, User } from '@/types/auth';

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
}

export function usePermissions() {
  const { user } = useAuth();

  const can = useCallback(
    (action: Action | string, subject: string, workspaceId?: string | null): boolean => {
      if (!user) return false;

      // 0. Super Admin has all permissions
      if (user.system_role === SystemRole.SUPER_ADMIN) {
        return true;
      }

      // 1. Check Global Roles (System-level)
      if (user.roles) {
        const hasGlobalPermission = user.roles.some((role) =>
          role.permissions?.some(
            (p) =>
              (p.action.toLowerCase() === action.toLowerCase() || p.action.toLowerCase() === Action.Manage) &&
              (p.subject.toLowerCase() === subject.toLowerCase() || p.subject.toLowerCase() === 'all')
          )
        );
        if (hasGlobalPermission) return true;
      }

      // 2. Check Workspace-specific Roles
      if (workspaceId && user.workspace_members) {
        const membership = user.workspace_members.find(
          (m) => m.workspace_id === workspaceId
        );

        if (membership && membership.role && membership.role.permissions) {
          const allowed = membership.role.permissions.some(
            (p) =>
              (p.action.toLowerCase() === action.toLowerCase() || p.action.toLowerCase() === Action.Manage) &&
              (p.subject.toLowerCase() === subject.toLowerCase() || p.subject.toLowerCase() === 'all')
          );
          if (!allowed) {
            console.warn(`[usePermissions] Permission denied for ${action} on ${subject} in workspace ${workspaceId}`);
          }
          return allowed;
        }
      }

      return false;
    },
    [user]
  );

  return { can, user };
}
