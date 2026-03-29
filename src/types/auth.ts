export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Revert = 'revert',
}

export interface Permission {
  id: string;
  action: Action | string;
  subject: string;
  conditions?: any;
}

export interface Role {
  id: string;
  name: string;
  permissions?: Permission[];
}

export interface WorkspaceMember {
  workspace_id: string;
  role_id: string;
  role?: Role;
  workspace?: {
    id: string;
    name: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  system_role: string;
  customer_id: string;
  customer?: {
    id: string;
    name: string;
    is_onboarding_completed: boolean;
  };
  roles?: Role[];
  workspace_members?: WorkspaceMember[];
}
