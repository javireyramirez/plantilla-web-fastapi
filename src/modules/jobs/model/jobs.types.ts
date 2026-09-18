import {
  Archive,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Mail,
  Shield,
  Trash2,
  Upload,
  Workflow,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { formatRelativeTime as sharedFormatRelativeTime } from '@/lib/date';

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export function getJobStatusLabel(t: (key: string, options?: any) => string, status: JobStatus | string): string {
  const normalized = (status || '').toUpperCase() as JobStatus;
  switch (normalized) {
    case 'PENDING':
      return t('jobs.status.pending', { defaultValue: 'Pendiente' });
    case 'RUNNING':
      return t('jobs.status.running', { defaultValue: 'En ejecución' });
    case 'COMPLETED':
      return t('jobs.status.completed', { defaultValue: 'Completado' });
    case 'FAILED':
      return t('jobs.status.failed', { defaultValue: 'Fallido' });
    case 'CANCELLED':
      return t('jobs.status.cancelled', { defaultValue: 'Cancelado' });
    default:
      return status;
  }
}

export interface JobStatusConfig {
  label: string;
  badgeClass: string;
  icon: LucideIcon;
  iconClass: string;
  animate?: boolean;
}

export function getJobStatusConfig(t: (key: string, options?: any) => string, status: JobStatus | string): JobStatusConfig {
  const normalized = (status || '').toUpperCase() as JobStatus;
  const label = getJobStatusLabel(t, normalized);

  switch (normalized) {
    case 'PENDING':
      return {
        label,
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: Clock,
        iconClass: 'text-amber-500',
      };
    case 'RUNNING':
      return {
        label,
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Loader2,
        iconClass: 'text-blue-500 animate-spin',
        animate: true,
      };
    case 'COMPLETED':
      return {
        label,
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2,
        iconClass: 'text-emerald-500',
      };
    case 'FAILED':
      return {
        label,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        icon: XCircle,
        iconClass: 'text-rose-500',
      };
    case 'CANCELLED':
      return {
        label,
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        icon: Ban,
        iconClass: 'text-slate-500',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-muted text-muted-foreground border-border',
        icon: Clock,
        iconClass: 'text-muted-foreground',
      };
  }
}

export function getJobStatusOptions(t: (key: string, options?: any) => string): SelectOption[] {
  return [
    { value: 'PENDING', label: getJobStatusLabel(t, 'PENDING') },
    { value: 'RUNNING', label: getJobStatusLabel(t, 'RUNNING') },
    { value: 'COMPLETED', label: getJobStatusLabel(t, 'COMPLETED') },
    { value: 'FAILED', label: getJobStatusLabel(t, 'FAILED') },
    { value: 'CANCELLED', label: getJobStatusLabel(t, 'CANCELLED') },
  ];
}

export function formatJobDuration(startedAt?: string | Date | null, completedAt?: string | Date | null): string {
  if (!startedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const seconds = diffMs / 1000;
  if (seconds < 1) return `${diffMs}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatRelativeTime(
  date: Date | string,
  t?: (key: string, options?: any) => string
): string {
  return sharedFormatRelativeTime(date, t);
}

export function getJobDefinitionTitle(
  t: (key: string, options?: any) => string,
  name?: string | null,
  fallbackTitle?: string | null
): string {
  if (!name) return fallbackTitle || '';
  const cleanName = name.replace(/\./g, '_');
  return t(`jobs.definitions.${cleanName}.title`, {
    defaultValue: t(`jobs.definitions.${name}.title`, {
      defaultValue: fallbackTitle || name,
    }),
  });
}

export function getJobDefinitionDescription(
  t: (key: string, options?: any) => string,
  name?: string | null,
  fallbackDescription?: string | null
): string {
  if (!name) return fallbackDescription || '';
  const cleanName = name.replace(/\./g, '_');
  return t(`jobs.definitions.${cleanName}.description`, {
    defaultValue: t(`jobs.definitions.${name}.description`, {
      defaultValue: fallbackDescription || '',
    }),
  });
}

export function getJobIcon(iconName?: string): LucideIcon {
  switch (iconName?.toLowerCase()) {
    case 'download':
      return Download;
    case 'upload':
      return Upload;
    case 'archive':
      return Archive;
    case 'mail':
      return Mail;
    case 'trash':
    case 'trash-2':
      return Trash2;
    case 'shield':
      return Shield;
    case 'bell':
      return Bell;
    default:
      return Workflow;
  }
}

