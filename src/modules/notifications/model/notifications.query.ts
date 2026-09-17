import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { notificationsService } from './notifications.service';
import {
  NotificationItem,
  NotificationQueryParams,
  NotificationUnreadCountResponse,
  NotificationsListResponse,
} from './notifications.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: NotificationQueryParams) =>
    [...notificationKeys.lists(), params] as const,
};

export function useUnreadCount(
  options?: Omit<
    UseQueryOptions<NotificationUnreadCountResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useNotifications(
  params?: NotificationQueryParams,
  options?: Omit<
    UseQueryOptions<NotificationsListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsService.getNotifications(params),
    ...options,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: (updatedItem, id) => {
      // 1. Optimistically decrement unread count
      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationKeys.unreadCount(),
        (old) => ({
          unread_count: Math.max(0, (old?.unread_count ?? 1) - 1),
        })
      );

      // 2. Accurately update each list query in cache
      const listQueries = queryClient.getQueryCache().findAll({
        queryKey: notificationKeys.lists(),
      });

      listQueries.forEach((q) => {
        const queryParams = q.queryKey[2] as NotificationQueryParams | undefined;
        queryClient.setQueryData<NotificationsListResponse>(q.queryKey, (old) => {
          if (!old || !old.data) return old;

          // If the query is filtering by unread_only, remove the item immediately
          if (queryParams?.unread_only) {
            return {
              ...old,
              data: old.data.filter((item) => item.id !== id),
              meta: {
                ...old.meta,
                total: Math.max(0, old.meta.total - 1),
              },
            };
          }

          // In "Todas", mark it as read
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id
                ? {
                    ...item,
                    is_read: true,
                    read_at: updatedItem?.read_at || new Date().toISOString(),
                  }
                : item
            ),
          };
        });
      });

      // 3. Invalidate lists so they stay synchronized with backend
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      // 1. Zero out unread count
      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationKeys.unreadCount(),
        { unread_count: 0 }
      );

      // 2. Clear unread lists or mark all as read
      const listQueries = queryClient.getQueryCache().findAll({
        queryKey: notificationKeys.lists(),
      });

      listQueries.forEach((q) => {
        const queryParams = q.queryKey[2] as NotificationQueryParams | undefined;
        queryClient.setQueryData<NotificationsListResponse>(q.queryKey, (old) => {
          if (!old || !old.data) return old;

          if (queryParams?.unread_only) {
            return {
              ...old,
              data: [],
              meta: {
                ...old.meta,
                total: 0,
              },
            };
          }

          return {
            ...old,
            data: old.data.map((item) => ({ ...item, is_read: true })),
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: { id: string; is_read?: boolean }) =>
      notificationsService.deleteNotification(item.id),
    onSuccess: (_, variables) => {
      if (!variables.is_read) {
        queryClient.setQueryData<NotificationUnreadCountResponse>(
          notificationKeys.unreadCount(),
          (old) => ({
            unread_count: Math.max(0, (old?.unread_count ?? 1) - 1),
          })
        );
      }

      // Remove deleted item from all lists in cache
      const listQueries = queryClient.getQueryCache().findAll({
        queryKey: notificationKeys.lists(),
      });

      listQueries.forEach((q) => {
        queryClient.setQueryData<NotificationsListResponse>(q.queryKey, (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((i) => i.id !== variables.id),
            meta: {
              ...old.meta,
              total: Math.max(0, old.meta.total - 1),
            },
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

