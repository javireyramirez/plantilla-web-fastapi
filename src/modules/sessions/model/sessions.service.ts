import instance from '@/config/api';
import { cleanApiParams, handleDualExportResponse } from '@/services/crud.service';
import type { JobType } from '@/modules/jobs/model/jobs.schema';

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

  async getSessionById(id: string): Promise<SessionAdminType> {
    const response = await instance.get<any>(`/sessions/${id}`);
    const item = response.data;
    return {
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

  async export(body: any, options?: { async_job?: boolean }): Promise<Blob | JobType> {
    const isAsync = Boolean(options?.async_job ?? body?.async_job);
    const params = isAsync ? { async_job: true } : undefined;

    const payload = {
      ...body,
      sort_by: body.sort_by ?? body.sortBy,
      sort_order: body.sort_order ?? body.sortOrder,
      filters: body.filters ? cleanApiParams(body.filters as Record<string, any>) : undefined,
    };
    delete (payload as any).async_job;

    const response = await instance.post<Blob>('/sessions/export', payload, {
      params,
      responseType: 'blob',
    });

    return handleDualExportResponse(response, 'sessions', body.format);
  }
}

export const sessionsService = new SessionsService();
