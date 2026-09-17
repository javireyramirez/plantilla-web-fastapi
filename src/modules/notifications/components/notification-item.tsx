import { useTranslation } from 'react-i18next';
import { ExternalLink, MailOpen, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useDeleteNotification, useMarkAsRead } from '../model/notifications.query';
import {
  NotificationItem as NotificationItemType,
  getNotificationConfig,
} from '../model/notifications.types';

interface NotificationItemProps {
  notification: NotificationItemType;
  onOpenDetail: (notification: NotificationItemType) => void;
}

export function NotificationItem({
  notification,
  onOpenDetail,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const { mutate: markAsRead, isPending: isMarkingRead } = useMarkAsRead();
  const { mutate: deleteNotification, isPending: isDeleting } =
    useDeleteNotification();

  const config = getNotificationConfig(t, notification.type);
  const Icon = config.icon;
  const timeAgo = formatRelativeTime(notification.created_at, t);

  const handleClick = () => {
    onOpenDetail(notification);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDetail(notification);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification({
      id: notification.id,
      is_read: notification.is_read,
    });
  };


  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 rounded-md p-3 text-left transition-colors hover:bg-accent/60',
        !notification.is_read ? 'bg-primary/5 font-medium' : 'text-muted-foreground'
      )}
    >
      {/* Icon Badge */}
      <div
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border',
          config.badgeClass
        )}
      >
        <Icon className={cn('size-4', config.iconClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-14">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              'truncate text-sm',
              !notification.is_read
                ? 'font-semibold text-foreground'
                : 'text-foreground/80'
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span
              className="size-2 shrink-0 rounded-full bg-notification"
              aria-label="No leída"
            />
          )}

        </div>

        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {notification.message}
        </p>

        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <span>{timeAgo}</span>
          {notification.action_url && (
            <button
              type="button"
              onClick={handleAction}
              className="flex items-center gap-0.5 text-primary hover:underline cursor-pointer"
            >
              {t('notifications.viewAction', { defaultValue: 'Ver' })}
              <ExternalLink className="size-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons on hover / right side */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            disabled={isMarkingRead}
            onClick={handleMarkAsRead}
            title={t('notifications.markAsRead', { defaultValue: 'Marcar como leída' })}
            className="size-7 hover:text-primary"
          >
            <MailOpen className="size-3.5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          onClick={handleDelete}
          title={t('notifications.delete', { defaultValue: 'Eliminar' })}
          className="size-7 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>

  );
}
