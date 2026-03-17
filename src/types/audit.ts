export interface AuditLogEntry {
  id: string;
  workspace_id: string;
  user_id?: string;
  asset_id?: string;
  action: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
