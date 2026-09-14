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
    const item = response.data?.data ?? response.data;
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

  async export(body: any): Promise<Blob> {
    const payload = {
      ...body,
      sort_by: body.sort_by ?? body.sortBy,
      sort_order: body.sort_order ?? body.sortOrder,
      filters: body.filters ? cleanApiParams(body.filters as Record<string, any>) : undefined,
    };
    const response = await instance.post<Blob>(`/audit/export`, payload, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers?.['content-disposition'];
    let baseFilename = 'audit_export';
    let extension = body.format === 'excel' ? 'xlsx' : body.format || 'csv';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        const fullFilename = filenameMatch[1];
        const lastDotIndex = fullFilename.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          baseFilename = fullFilename.substring(0, lastDotIndex);
          extension = fullFilename.substring(lastDotIndex + 1);
        } else {
          baseFilename = fullFilename;
        }
      }
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `${baseFilename}_${timestamp}.${extension}`;

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

export const auditService = new AuditService();
