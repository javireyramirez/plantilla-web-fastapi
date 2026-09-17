import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'SYSTEM'
  | (string & {});

export interface NotificationItem {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  read_at?: string | null;
  is_read: boolean;
  data?: Record<string, any> | null;
  created_at: string;
}

export interface NotificationUnreadCountResponse {
  unread_count: number;
}

export interface NotificationsListResponse {
  data: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  unread_only?: boolean;
  type?: string;
}

export interface JobProgressEvent {
  job_id: string;
  progress: number;
  progress_message?: string | null;
  status: string;
}

export interface JobCompletedEvent {
  job_id: string;
  status: string;
  result?: Record<string, any> | null;
}

export interface JobFailedEvent {
  job_id: string;
  status: string;
  error?: string | null;
}

export interface NotificationConfig {
  label: string;
  badgeClass: string;
  icon: LucideIcon;
  iconClass: string;
}

export function getNotificationConfig(
  t: (key: string, options?: any) => string,
  type: NotificationType | string
): NotificationConfig {
  const normalized = (type || '').toUpperCase();

  switch (normalized) {
    case 'SUCCESS':
    case 'JOB_COMPLETED':
      return {
        label: t('notifications.types.success', { defaultValue: 'Completado' }),
        badgeClass: 'bg-success/15 text-success border-success/30',
        icon: CheckCircle2,
        iconClass: 'text-success',
      };
    case 'WARNING':
      return {
        label: t('notifications.types.warning', { defaultValue: 'Advertencia' }),
        badgeClass: 'bg-warning/15 text-warning border-warning/30',
        icon: AlertTriangle,
        iconClass: 'text-warning',
      };
    case 'ERROR':
    case 'JOB_FAILED':
      return {
        label: t('notifications.types.error', { defaultValue: 'Error' }),
        badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
        icon: XCircle,
        iconClass: 'text-destructive',
      };
    case 'INFO':
      return {
        label: t('notifications.types.info', { defaultValue: 'Información' }),
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
        icon: Info,
        iconClass: 'text-primary',
      };
    case 'SYSTEM':
      return {
        label: t('notifications.types.system', { defaultValue: 'Sistema' }),
        badgeClass: 'bg-secondary text-secondary-foreground border-border',
        icon: BellRing,
        iconClass: 'text-secondary-foreground',
      };
    default:
      return {
        label: type,
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: Bell,
        iconClass: 'text-muted-foreground',
      };
  }

}
