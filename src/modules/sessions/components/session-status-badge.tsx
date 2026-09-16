import { CheckCircle2, ShieldAlert, UserCheck, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SessionAdminType } from '../model/sessions.schema';

interface SessionStatusBadgeProps {
  session: SessionAdminType;
  className?: string;
}

export function SessionStatusBadge({ session, className }: SessionStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {session.is_valid ? (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-xs font-medium"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>{t('sessions.status.active', { defaultValue: 'Activa' })}</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-muted-foreground/30 bg-muted/40 text-muted-foreground gap-1 text-xs font-medium"
        >
          <XCircle className="h-3 w-3" />
          <span>{t('sessions.status.revoked', { defaultValue: 'Inactiva / Revocada' })}</span>
        </Badge>
      )}

      {session.is_current && (
        <Badge
          variant="default"
          className="bg-primary/90 text-primary-foreground hover:bg-primary gap-1 text-xs font-medium"
        >
          <UserCheck className="h-3 w-3" />
          <span>{t('sessions.status.current', { defaultValue: 'Actual' })}</span>
        </Badge>
      )}

      {session.is_impersonated && (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-xs font-medium"
        >
          <ShieldAlert className="h-3 w-3" />
          <span>{t('sessions.status.impersonated', { defaultValue: 'Suplantada' })}</span>
        </Badge>
      )}
    </div>
  );
}
