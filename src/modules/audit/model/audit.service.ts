import instance from '@/config/api';
import { cleanApiParams } from '@/services/crud.service';

import { AuditLogType, AuditLogsListResponse, GetAuditLogsQuery } from './audit.schema';

class AuditService {
  async getAudit(params?: any): Promise<AuditLogsListResponse> {
    const apiParams = cleanApiParams(params);
    const response = await instance.get<any>(`/audit`, { params: apiParams });
    const raw = response.data;
    const items = (raw?.data || []).map((item: any) => ({
      id: item.id,
      userId: item.actor_id ?? item.userId ?? null,
      actor_id: item.actor_id ?? item.userId ?? null,
      action: item.action,
      moduleSlug: item.entity_type ?? item.moduleSlug ?? '',
      entity_type: item.entity_type ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? null,
      entity_id: item.entity_id ?? item.entityId ?? null,
      displayName: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      entity_name: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      description: item.details ?? null,
      metadata: item.changes ?? item.metadata ?? null,
      ipAddress: item.ip_address ?? item.ipAddress ?? null,
      ip_address: item.ip_address ?? item.ipAddress ?? null,
      userAgent: item.user_agent ?? item.userAgent ?? null,
      user_agent: item.user_agent ?? item.userAgent ?? null,
      createdAt: new Date(item.created_at ?? item.createdAt),
      created_at: item.created_at ?? item.createdAt,
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
      actor_id: item.actor_id ?? item.userId ?? null,
      action: item.action,
      moduleSlug: item.entity_type ?? item.moduleSlug ?? '',
      entity_type: item.entity_type ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? null,
      entity_id: item.entity_id ?? item.entityId ?? null,
      displayName: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      entity_name: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      description: item.details ?? null,
      metadata: item.changes ?? item.metadata ?? null,
      ipAddress: item.ip_address ?? item.ipAddress ?? null,
      ip_address: item.ip_address ?? item.ipAddress ?? null,
      userAgent: item.user_agent ?? item.userAgent ?? null,
      user_agent: item.user_agent ?? item.userAgent ?? null,
      createdAt: new Date(item.created_at ?? item.createdAt),
      created_at: item.created_at ?? item.createdAt,
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
