import instance from '@/config/api';

import { BulkIdsBody, BulkResponse, GetTrashQuery, TrashListResponse } from './trash.schema';

class TrashService {
  async getTrash(params?: GetTrashQuery): Promise<TrashListResponse> {
    const apiParams: Record<string, any> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    };
    if (params?.search) apiParams.q = params.search;
    if (params?.deletedAtFrom) apiParams.deleted_at_from = params.deletedAtFrom;
    if (params?.deletedAtTo) apiParams.deleted_at_to = params.deletedAtTo;
    if (params?.expiresAtFrom) apiParams.expires_at_from = params.expiresAtFrom;
    if (params?.expiresAtTo) apiParams.expires_at_to = params.expiresAtTo;
    if (params?.moduleId) apiParams.entity_type = params.moduleId;

    const response = await instance.get<any>(`/trash`, { params: apiParams });
    const raw = response.data;
    const items = (raw?.data || []).map((item: any) => ({
      id: item.id,
      moduleId: item.module_id ?? item.moduleId ?? item.id,
      moduleSlug: item.entity_type ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? '',
      displayName: item.name ?? item.displayName ?? item.details ?? '-',
      deletedAt: new Date(item.deleted_at ?? item.deletedAt),
      deletedBy: item.deleted_by ?? item.deletedBy ?? null,
      deletedByName: item.deleted_by_name ?? item.deletedByName ?? null,
      deletedByEmail: item.deleted_by_email ?? item.deletedByEmail ?? null,
      deletor:
        item.deletor ??
        (item.deleted_by
          ? {
              name: item.deleted_by_name ?? null,
              email: item.deleted_by_email ?? null,
            }
          : null),
      expiresAt: new Date(item.expires_at ?? item.expiresAt),
      ownerId: item.owner_id ?? item.ownerId ?? null,
      createdBy: item.created_by ?? item.createdBy ?? null,
      metadata: item.data_backup ?? item.metadata ?? null,
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

  async bulkRestore(data: BulkIdsBody) {
    const response = await instance.post<BulkResponse>(`/trash/bulk/restore`, data);
    return response.data;
  }

  async bulkDelete(data: BulkIdsBody) {
    const response = await instance.post<BulkResponse>(`/trash/bulk/purge`, data);
    return response.data;
  }

  async restoreItem(id: string) {
    const response = await instance.post(`/trash/${id}/restore`);
    return response.data;
  }

  async purgeItem(id: string) {
    const response = await instance.delete(`/trash/${id}/purge`);
    return response.data;
  }
}

export const trashService = new TrashService();
