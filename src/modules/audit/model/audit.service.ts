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
      moduleSlug: item.module_slug ?? item.moduleSlug ?? item.entity_type ?? '',
      module_slug: item.module_slug ?? item.moduleSlug ?? item.entity_type ?? '',
      moduleName: item.module_name ?? item.moduleName ?? null,
      module_name: item.module_name ?? item.moduleName ?? null,
      entity_type: item.entity_type ?? item.module_slug ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? null,
      entity_id: item.entity_id ?? item.entityId ?? null,
      displayName: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      entity_name: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      description: item.details ?? null,
      details: item.details ?? null,
      changes: item.changes ?? null,
      metadata: item.changes ?? item.metadata ?? null,
      ipAddress: item.ip_address ?? item.ipAddress ?? null,
      ip_address: item.ip_address ?? item.ipAddress ?? null,
      userAgent: item.user_agent ?? item.userAgent ?? null,
      user_agent: item.user_agent ?? item.userAgent ?? null,
      createdAt: new Date(item.created_at ?? item.createdAt),
      created_at: item.created_at ?? item.createdAt,
      user: item.user ?? (item.actor_name || item.actor_email
        ? {
            id: item.actor_id ?? null,
            name: item.actor_name ?? null,
            email: item.actor_email ?? null,
          }
        : null),
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

  async getAuditById(auditId: string): Promise<AuditLogType> {
    const response = await instance.get<any>(`/audit/${auditId}`);
    const item = response.data?.data ?? response.data;
    return {
      id: item.id,
      userId: item.actor_id ?? item.userId ?? null,
      actor_id: item.actor_id ?? item.userId ?? null,
      action: item.action,
      moduleSlug: item.module_slug ?? item.moduleSlug ?? item.entity_type ?? '',
      module_slug: item.module_slug ?? item.moduleSlug ?? item.entity_type ?? '',
      moduleName: item.module_name ?? item.moduleName ?? null,
      module_name: item.module_name ?? item.moduleName ?? null,
      entity_type: item.entity_type ?? item.module_slug ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? null,
      entity_id: item.entity_id ?? item.entityId ?? null,
      displayName: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      entity_name: item.entity_name ?? item.details ?? item.actor_name ?? item.entity_type ?? '-',
      description: item.details ?? null,
      details: item.details ?? null,
      changes: item.changes ?? null,
      metadata: item.changes ?? item.metadata ?? null,
      ipAddress: item.ip_address ?? item.ipAddress ?? null,
      ip_address: item.ip_address ?? item.ipAddress ?? null,
      userAgent: item.user_agent ?? item.userAgent ?? null,
      user_agent: item.user_agent ?? item.userAgent ?? null,
      createdAt: new Date(item.created_at ?? item.createdAt),
      created_at: item.created_at ?? item.createdAt,
      user: item.user ?? (item.actor_name || item.actor_email
        ? {
            id: item.actor_id ?? null,
            name: item.actor_name ?? null,
            email: item.actor_email ?? null,
          }
        : null),
    } as AuditLogType;
  }

  async getExportFormats(): Promise<string[]> {
    const { data } = await instance.get<string[]>(`/audit/export/formats`);
    return data;
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
      filename = `audit_logs_${timestamp}.${ext}`;
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

export const auditService = new AuditService();
