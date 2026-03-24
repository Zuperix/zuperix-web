export interface Webhook {
  id: string;
  workspace_id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event: string;
  status: 'SUCCESS' | 'FAILED';
  status_code: number | null;
  response_time: number | null;
  attempt_count: number;
  error_message: string | null;
  payload: any;
  created_at: string;
}

export interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  avg_response_time: number;
  retry_distribution: Record<number, number>;
}
