export enum AssetWorkflowStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum WorkflowTaskStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  conditions?: any;
  stages?: WorkflowStage[];
}

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  name: string;
  order: number;
  required_approvals: number;
  approver_role_id?: string;
  conditions?: any;
}

export interface AssetWorkflow {
  id: string;
  asset_id: string;
  workflow_id: string;
  current_stage_id: string;
  status: AssetWorkflowStatus;
  workflow?: Workflow;
  asset?: any;
  tasks?: WorkflowTask[];
}

export interface WorkflowTask {
  id: string;
  asset_workflow_id: string;
  stage_id: string;
  user_id: string;
  status: WorkflowTaskStatus;
  comment?: string;
  created_at: string;
  updated_at: string;
  asset_workflow?: AssetWorkflow;
  stage?: WorkflowStage;
}
