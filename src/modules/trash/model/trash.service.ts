import instance from '@/config/api';
import { cleanApiParams } from '@/services/crud.service';

import { BulkIdsBody, BulkResponse, GetTrashQuery, TrashListResponse } from './trash.schema';

class TrashService {
  async getTrash(params?: GetTrashQuery): Promise<TrashListResponse> {
    const apiParams = cleanApiParams(params as Record<string, any>);
    // Back `_build_category_filter`: "storage"/"files" -> entity_type == STORAGE,
    // "entities" -> entity_type != STORAGE. Normalizar legacy "documents" -> "storage"
    // y no forzar entity_type="document" (rompería el filtro de categoría).
    if (apiParams.category === 'documents' || apiParams.category === 'files') {
      apiParams.category = 'storage';
    }
    if (apiParams.entity_type === 'document' || apiParams.entity_type === 'documents') {
      apiParams.entity_type = 'storage';
    }

    const response = await instance.get<any>(`/trash`, { params: apiParams });
    const raw = response.data;
    const items = (raw?.data || []).map((item: any) => ({
      id: item.id,
      moduleId: item.module_id ?? item.moduleId ?? item.id,
      module_id: item.module_id ?? item.moduleId ?? item.id,
      moduleSlug: item.entity_type ?? item.moduleSlug ?? '',
      module_slug: item.entity_type ?? item.moduleSlug ?? '',
      entityId: item.entity_id ?? item.entityId ?? '',
      entity_id: item.entity_id ?? item.entityId ?? '',
      displayName: item.name ?? item.displayName ?? item.details ?? '-',
      display_name: item.name ?? item.displayName ?? item.details ?? '-',
      name: item.name ?? item.displayName ?? item.details ?? '-',
      deletedAt: new Date(item.deleted_at ?? item.deletedAt),
      deleted_at: item.deleted_at ?? item.deletedAt,
      deletedBy: item.deleted_by ?? item.deletedBy ?? null,
      deleted_by: item.deleted_by ?? item.deletedBy ?? null,
      deletedByName: item.deleted_by_name ?? item.deletedByName ?? null,
      deleted_by_name: item.deleted_by_name ?? item.deletedByName ?? null,
      deletedByEmail: item.deleted_by_email ?? item.deletedByEmail ?? null,
      deleted_by_email: item.deleted_by_email ?? item.deletedByEmail ?? null,
      deletor:
        item.deletor ??
        (item.deleted_by
          ? {
              name: item.deleted_by_name ?? null,
              email: item.deleted_by_email ?? null,
            }
          : null),
      expiresAt: new Date(item.expires_at ?? item.expiresAt),
      expires_at: item.expires_at ?? item.expiresAt,
      ownerId: item.owner_id ?? item.ownerId ?? null,
      owner_id: item.owner_id ?? item.ownerId ?? null,
      createdBy: item.created_by ?? item.createdBy ?? null,
      created_by: item.created_by ?? item.createdBy ?? null,
      metadata: item.data_backup ?? item.metadata ?? null,
      modulePrincipalEntity: item.module_principal_entity ?? null,
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
