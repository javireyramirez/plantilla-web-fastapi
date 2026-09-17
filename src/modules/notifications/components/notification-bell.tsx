import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useMarkAllAsRead,
  useNotifications,
  useUnreadCount,
} from '../model/notifications.query';
import { NotificationItem as NotificationItemType } from '../model/notifications.types';
import { useNotificationDialog } from '../model/use-notification-dialog';
import { NotificationDetailDialog } from './notification-detail-dialog';
import { NotificationItem } from './notification-item';

export function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const {
    selectedNotification,
    isOpen: isDetailOpen,
    openDialog,
    closeDialog,
  } = useNotificationDialog();

  // Queries
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unread_count ?? 0;

  const { data: notificationsData, isLoading } = useNotifications({
    page: 1,
    limit: 20,
    unread_only: unreadOnly ? true : undefined,
  });

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const notifications = notificationsData?.data ?? [];


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-md"
          aria-label={t('notifications.title', { defaultValue: 'Notificaciones' })}
        >
          <Bell className="size-5 text-muted-foreground transition-colors hover:text-foreground" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-notification px-1 text-[10px] font-bold text-notification-foreground shadow-xs animate-in zoom-in-50'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-84 sm:w-96 p-0 shadow-xl border-border/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">
              {t('notifications.title', { defaultValue: 'Notificaciones' })}
            </h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-notification/10 px-2 py-0.5 text-[11px] font-medium text-notification">
                {t('notifications.unreadCount', {
                  count: unreadCount,
                  defaultValue: `${unreadCount} no leídas`,
                })}
              </span>
            )}

          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={() => markAllAsRead()}
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {isMarkingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            <span>
              {t('notifications.markAllAsRead', {
                defaultValue: 'Marcar leídas',
              })}
            </span>
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-y bg-muted/30 px-3 py-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              !unreadOnly
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('notifications.all', { defaultValue: 'Todas' })}
          </button>
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              unreadOnly
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('notifications.unreadOnly', { defaultValue: 'No leídas' })}
            {unreadCount > 0 && ` (${unreadCount})`}
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <div className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="rounded-full bg-muted p-3 text-muted-foreground">
                <BellOff className="size-6" />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {unreadOnly
                  ? t('notifications.emptyUnread', {
                      defaultValue: 'No tienes notificaciones sin leer',
                    })
                  : t('notifications.empty', {
                      defaultValue: 'No tienes notificaciones',
                    })}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onOpenDetail={(notif) => {
                  openDialog(notif);
                  setIsOpen(false);
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>

      <NotificationDetailDialog
        notification={selectedNotification}
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      />
    </Popover>

  );
}
