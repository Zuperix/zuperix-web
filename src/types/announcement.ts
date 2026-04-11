export enum AnnouncementStyle {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface AnnouncementConfig {
  announcement_header: string | null;
  announcement_description: string | null;
  announcement_start_at: string | null;
  announcement_end_at: string | null;
  announcement_style: AnnouncementStyle;
}
