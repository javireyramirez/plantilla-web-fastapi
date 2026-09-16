import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { getJobStatusConfig, JobStatus } from '../model/jobs.types';

interface JobStatusBadgeProps {
  status: JobStatus | string;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const { t } = useTranslation();
  const config = getJobStatusConfig(t, status);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.badgeClass,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', config.iconClass)} />
      <span>{config.label}</span>
    </span>
  );
}
