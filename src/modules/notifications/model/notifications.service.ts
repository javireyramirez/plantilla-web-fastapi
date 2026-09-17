import instance from '@/config/api';
import {
  NotificationItem,
  NotificationQueryParams,
  NotificationUnreadCountResponse,
  NotificationsListResponse,
} from './notifications.types';

class NotificationsService {
  /**
   * SSOT for SSE notification stream URL.
   * Supports ?token=... for cross-port / dev environments where SameSite=Lax blocks cookies.
   */
  getNotificationStreamUrl(token?: string): string {
    const base = import.meta.env.VITE_BACK_URL || '';
    const url = `${base}/api/notifications/stream`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  }

  /**
   * SSOT for SSE background jobs stream URL.
   */
  getJobStreamUrl(jobId?: string, token?: string): string {
    const base = import.meta.env.VITE_BACK_URL || '';
    const endpoint = jobId ? `/api/jobs/${jobId}/stream` : '/api/jobs/stream';
    const url = `${base}${endpoint}`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  }

  /**
   * Fetch unread notifications count for the bell badge.
   */
  async getUnreadCount(): Promise<NotificationUnreadCountResponse> {
    const response = await instance.get<NotificationUnreadCountResponse>(
      '/notifications/unread-count'
    );
    return response.data;
  }

  /**
   * Fetch paginated notifications list with optional filters.
   */
  async getNotifications(
    params?: NotificationQueryParams
  ): Promise<NotificationsListResponse> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
      if (params.unread_only !== undefined) cleanParams.unread_only = params.unread_only;
      if (params.type !== undefined) cleanParams.type = params.type;
    }

    const response = await instance.get<any>('/notifications', {
      params: cleanParams,
    });
    const raw = response.data;

    return {
      data: raw?.data || [],
      meta: {
        page: raw?.meta?.page ?? 1,
        limit: raw?.meta?.limit ?? 20,
        total: raw?.meta?.total ?? 0,
        totalPages: raw?.meta?.total_pages ?? raw?.meta?.totalPages ?? 1,
      },
    };
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    const response = await instance.patch<any>(`/notifications/${id}/read`);
    return response.data?.data ?? response.data;
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<{ marked_count: number }> {
    const response = await instance.post<{ marked_count: number }>(
      '/notifications/read-all'
    );
    return response.data;
  }

  /**
   * Delete a notification from history.
   */
  async deleteNotification(id: string): Promise<void> {
    await instance.delete(`/notifications/${id}`);
  }
}

export const notificationsService = new NotificationsService();
