import instance from '@/config/api';
import { cleanApiParams } from '@/services/crud.service';

import {
  BulkResponse,
  MessageResponse,
  SessionAdminType,
  SessionsListResponse,
} from './sessions.schema';

class SessionsService {
  async getSessions(params?: any): Promise<SessionsListResponse> {
    const apiParams = cleanApiParams(params);
    const response = await instance.get<any>('/sessions', { params: apiParams });
    const raw = response.data;

    const items: SessionAdminType[] = (raw?.data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.user_name,
      user_email: item.user_email,
      ip_address: item.ip_address ?? null,
      user_agent: item.user_agent ?? null,
      is_valid: Boolean(item.is_valid),
      impersonated_by: item.impersonated_by ?? null,
      is_impersonated: Boolean(item.is_impersonated),
      created_at: item.created_at,
      expires_at: item.expires_at,
      is_current: Boolean(item.is_current),
    }));

    return {
      data: items,
      meta: {
        page: raw?.meta?.page ?? 1,
        limit: raw?.meta?.limit ?? 20,
        total: raw?.meta?.total ?? 0,
        totalPages: raw?.meta?.total_pages ?? raw?.meta?.totalPages ?? 1,
      },
    };
  }

  async revokeSession(id: string): Promise<MessageResponse> {
    const response = await instance.delete<MessageResponse>(`/sessions/${id}`);
    return response.data;
  }

  async bulkRevoke(ids: string[]): Promise<BulkResponse> {
    const response = await instance.post<BulkResponse>('/sessions/bulk/revoke', { ids });
    return response.data;
  }

  async export(body: any): Promise<Blob> {
    const payload = {
      ...body,
      is_trash: false,
      sort_by: body.sort_by ?? body.sortBy,
      sort_order: body.sort_order ?? body.sortOrder,
      filters: body.filters ? cleanApiParams(body.filters as Record<string, any>) : undefined,
    };
    const response = await instance.post<Blob>('/sessions/export', payload, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers?.['content-disposition'];
    let filename = '';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    if (!filename) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const ext =
        body.format === 'excel'
          ? 'xlsx'
          : body.format === 'google_sheets' || body.format === 'tsv'
            ? 'tsv'
            : body.format || 'csv';
      filename = `sessions_${timestamp}.${ext}`;
    }

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  }
}

export const sessionsService = new SessionsService();
