import instance from '@/config/api';

import { AuditLogType, AuditLogsListResponse, GetAuditLogsQuery } from './audit.schema';

class AuditService {
  async getAudit(params?: any): Promise<AuditLogsListResponse> {
    const apiParams: Record<string, any> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    };
    if (params?.moduleSlug) {
      apiParams.entity_type = Array.isArray(params.moduleSlug)
        ? params.moduleSlug.join(',')
        : params.moduleSlug;
    }
    if (params?.entityId) apiParams.entity_id = params.entityId;
    if (params?.action) apiParams.action = params.action;
    if (params?.userId) {
      apiParams.actor_id = Array.isArray(params.userId) ? params.userId[0] : params.userId;
    }
    if (params?.createdAtFrom) {
      apiParams.from_date =
        params.createdAtFrom instanceof Date
          ? params.createdAtFrom.toISOString()
          : params.createdAtFrom;
    }
    if (params?.createdAtTo) {
      apiParams.to_date =
        params.createdAtTo instanceof Date
          ? params.createdAtTo.toISOString()
          : params.createdAtTo;
    }

    const response = await instance.get<any>(`/audit`, { params: apiParams });
    const raw = response.data;
    const items = (raw?.data || []).map((item: any) => ({
      id: item.id,
      userId: item.actor_id ?? item.userId ?? null,
      action: item.action,
      moduleSlug: item.entity_type ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? null,
      displayName: item.details ?? item.actor_name ?? item.entity_type ?? '-',
      description: item.details ?? null,
      metadata: item.changes ?? item.metadata ?? null,
      ipAddress: item.ip_address ?? item.ipAddress ?? null,
      userAgent: item.user_agent ?? item.userAgent ?? null,
      createdAt: new Date(item.created_at ?? item.createdAt),
      user:
        item.actor_name || item.actor_email
          ? {
              name: item.actor_name ?? null,
              email: item.actor_email ?? null,
            }
          : (item.user ?? null),
    }));

    return {
      data: items,
      meta: {
        page: raw?.meta?.page ?? 1,
        limit: raw?.meta?.limit ?? 10,
        total: raw?.meta?.total ?? 0,
        totalPages: raw?.meta?.total_pages ?? raw?.meta?.totalPages ?? 1,
      },
    };
  }

  async getAuditById(auditId: string): Promise<AuditLogType> {
    const response = await instance.get<any>(`/audit/${auditId}`);
    const item = response.data;
    return {
      id: item.id,
      userId: item.actor_id ?? item.userId ?? null,
      action: item.action,
      moduleSlug: item.entity_type ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? null,
      displayName: item.details ?? item.actor_name ?? item.entity_type ?? '-',
      description: item.details ?? null,
      metadata: item.changes ?? item.metadata ?? null,
      ipAddress: item.ip_address ?? item.ipAddress ?? null,
      userAgent: item.user_agent ?? item.userAgent ?? null,
      createdAt: new Date(item.created_at ?? item.createdAt),
      user:
        item.actor_name || item.actor_email
          ? {
              name: item.actor_name ?? null,
              email: item.actor_email ?? null,
            }
          : (item.user ?? null),
    } as AuditLogType;
  }
}

export const auditService = new AuditService();
