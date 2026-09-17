import { useTranslation } from 'react-i18next';
import { Check, ExternalLink, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  useDeleteNotification,
  useMarkAsRead,
} from '../model/notifications.query';
import {
  NotificationItem,
  getNotificationConfig,
} from '../model/notifications.types';

interface NotificationDetailDialogProps {
  notification: NotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
}: NotificationDetailDialogProps) {
  const { t } = useTranslation();
  const { mutate: markAsRead, isPending: isMarkingRead } = useMarkAsRead();
  const { mutate: deleteNotification, isPending: isDeleting } =
    useDeleteNotification();

  if (!notification) return null;

  const config = getNotificationConfig(t, notification.type);
  const Icon = config.icon;
  const timeAgo = formatRelativeTime(notification.created_at, t);

  const handleMarkAsReadAndClose = () => {
    markAsRead(notification.id);
    onOpenChange(false);
  };

  const handleDeleteAndClose = () => {
    deleteNotification({
      id: notification.id,
      is_read: notification.is_read,
    });
    onOpenChange(false);
  };

  const handleOpenActionUrl = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (!notification.action_url) return;
    const url = notification.action_url.trim();
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (url.startsWith('/api/') || url.startsWith('api/')) {
      const base = import.meta.env.VITE_BACK_URL || '';
      const fullUrl = url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
      const fullUrl = `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
      window.location.href = fullUrl;
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border',
                config.badgeClass
              )}
            >
              <Icon className={cn('size-4', config.iconClass)} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {timeAgo}
            </span>
          </div>

          <DialogTitle className="text-left text-lg font-bold leading-snug">
            {notification.title}
          </DialogTitle>
        </DialogHeader>

        {/* Message body */}
        <div className="py-2">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {notification.message}
          </p>

          {/* Optional action URL display */}
          {notification.action_url && (
            <div className="mt-4 pt-3 border-t">
              <button
                type="button"
                onClick={handleOpenActionUrl}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                <span>{t('notifications.openUrl', { defaultValue: 'Abrir enlace adjunto' })}</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
          )}
        </div>

        {/* Action buttons footer */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDeleteAndClose}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <Trash2 className="size-4" />
            <span>{t('notifications.delete', { defaultValue: 'Eliminar' })}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t('common.close', { defaultValue: 'Cerrar' })}
            </Button>

            {!notification.is_read && (
              <Button
                type="button"
                size="sm"
                disabled={isMarkingRead}
                onClick={handleMarkAsReadAndClose}
                className="gap-1.5"
              >
                <Check className="size-4" />
                <span>{t('notifications.markAsRead', { defaultValue: 'Marcar como leída' })}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
