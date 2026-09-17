import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSession } from '@/config/auth-client';
import {
  notificationKeys,
} from '../model/notifications.query';
import { notificationsService } from '../model/notifications.service';
import {
  NotificationItem,
  NotificationUnreadCountResponse,
  getNotificationConfig,
} from '../model/notifications.types';
import { useNotificationDialog } from '../model/use-notification-dialog';


interface UseNotificationStreamOptions {
  enabled?: boolean;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { enabled = true } = options;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);

  // Keep track of recently received notification IDs to prevent duplicate toasts
  const seenIdsRef = useRef<Set<string>>(new Set());
  const activeSourceRef = useRef<EventSource | null>(null);

  const token = (session as any)?.session?.token || (session as any)?.token;

  useEffect(() => {
    // Only connect if enabled and a valid session is present
    if (!enabled || !session?.user) {
      if (activeSourceRef.current) {
        activeSourceRef.current.close();
        activeSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Close any previous connection (guards against React 19 StrictMode double-mount)
    if (activeSourceRef.current) {
      activeSourceRef.current.close();
      activeSourceRef.current = null;
    }

    const streamUrl = notificationsService.getNotificationStreamUrl(token);
    const es = new EventSource(streamUrl, {
      withCredentials: true,
    });
    activeSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.addEventListener('notification', (event: MessageEvent) => {
      try {
        const notif: NotificationItem = JSON.parse(event.data);
        if (!notif || !notif.id) return;

        // Deduplicate notification ID
        if (seenIdsRef.current.has(notif.id)) {
          return;
        }
        seenIdsRef.current.add(notif.id);

        // Cap set size to 100 IDs to avoid memory leaks
        if (seenIdsRef.current.size > 100) {
          const firstItem = seenIdsRef.current.values().next().value;
          if (firstItem) {
            seenIdsRef.current.delete(firstItem);
          }
        }

        // 1. Optimistically increment unread count in cache
        queryClient.setQueryData<NotificationUnreadCountResponse>(
          notificationKeys.unreadCount(),
          (old) => ({
            unread_count: (old?.unread_count ?? 0) + 1,
          })
        );

        // 2. Invalidate lists so the new item appears on open
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });

        // 3. Show Sonner Toast wired to open notification detail modal
        const handleOpenDetail = () => {
          useNotificationDialog.getState().openDialog(notif);
        };

        const toastOptions = {
          description: notif.message,
          action: {
            label: t('notifications.viewAction', { defaultValue: 'Ver' }),
            onClick: handleOpenDetail,
          },
          onClick: handleOpenDetail,
        };

        const normalizedType = (notif.type || '').toUpperCase();
        if (normalizedType === 'ERROR' || normalizedType === 'JOB_FAILED') {
          toast.error(notif.title, toastOptions);
        } else if (normalizedType === 'WARNING') {
          toast.warning(notif.title, toastOptions);
        } else if (normalizedType === 'SUCCESS' || normalizedType === 'JOB_COMPLETED') {
          toast.success(notif.title, toastOptions);
        } else {
          toast.info(notif.title, toastOptions);
        }
      } catch (err) {
        console.error('Error parsing notification SSE payload:', err);
      }
    });


    es.onerror = () => {
      setIsConnected(false);
      // Native EventSource automatically attempts to reconnect unless closed
    };

    return () => {
      if (activeSourceRef.current) {
        activeSourceRef.current.close();
        activeSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, session?.user?.id, token, navigate, queryClient, t]);

  return { isConnected };
}
