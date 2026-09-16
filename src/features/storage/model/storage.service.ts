import axios from 'axios';

import instance from '@/config/api';
import { GetDocumentsQuery } from '@/schemas/storage.schema';

class StorageService {
  // ==========================================
  // 1. CONSULTAS Y LECTURA
  // ==========================================

  getDocuments = async (entityType?: string, entityId?: string, query?: GetDocumentsQuery) => {
    const apiParams: Record<string, any> = {
      page: query?.page ?? 1,
      limit: query?.limit ?? 10,
    };
    if (entityType) apiParams.entity_type = entityType;
    if (entityId) apiParams.entity_id = entityId;
    if (query?.sortBy) {
      apiParams.sort_by =
        query.sortBy === 'fileName'
          ? 'name'
          : query.sortBy === 'contentType'
            ? 'content_type'
            : query.sortBy === 'size'
              ? 'size_bytes'
              : query.sortBy === 'createdAt'
                ? 'created_at'
                : query.sortBy;
    }
    if (query?.sortOrder) apiParams.sort_order = query.sortOrder;
    if (query?.fileName) apiParams.search = query.fileName;
    if (query?.createdFrom) apiParams.created_at_from = query.createdFrom;
    if (query?.createdTo) apiParams.created_at_to = query.createdTo;
    if (query?.contentTypes && query.contentTypes.length > 0) {
      apiParams.content_types = query.contentTypes.slice(0, 100);
    }
    if (query?.sizeMin !== undefined) apiParams.size_min = query.sizeMin;
    if (query?.sizeMax !== undefined) apiParams.size_max = query.sizeMax;
    if (query?.isTrash !== undefined) apiParams.is_trash = query.isTrash;

    const response = await instance.get<any>(`/storage`, {
      params: apiParams,
    });
    const raw = response.data;
    const rawItems = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.documents)
          ? raw.documents
          : [];

    const documents = rawItems.map((item: any) => ({
      id: item.id,
      fileName: item.name ?? item.fileName ?? '',
      name: item.name ?? item.fileName ?? '',
      contentType: item.content_type ?? item.contentType ?? 'application/octet-stream',
      size: item.size_bytes ?? item.size ?? 0,
      sizeBytes: item.size_bytes ?? item.size ?? 0,
      url: item.file_key ?? item.url ?? '',
      externalUrl: item.external_url ?? item.externalUrl ?? null,
      description: item.description ?? null,
      isUploaded: item.is_uploaded ?? item.isUploaded ?? true,
      createdAt: item.created_at ?? item.createdAt,
      updatedAt: item.updated_at ?? item.updatedAt,
      isTrash: item.status === 'TRASHED' || (item.is_trash ?? item.isTrash ?? false),
      entityType: item.entity_type ?? item.entityType,
      entityId: item.entity_id ?? item.entityId,
      modulePrincipalEntity: item.module_principal_entity ?? item.modulePrincipalEntity ?? null,
      version: item.version ?? 1,
    }));

    return {
      documents,
      data: documents,
      meta: {
        page: raw?.meta?.page ?? 1,
        limit: raw?.meta?.limit ?? 10,
        total: raw?.meta?.total ?? documents.length,
        totalPages: raw?.meta?.total_pages ?? raw?.meta?.totalPages ?? 1,
      },
    };
  };

  getDocumentDetail = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.get<any>(`/storage/${documentId}`);
    const item = response.data;
    const etag = response.headers?.etag || response.headers?.ETag;
    return {
      id: item.id,
      fileName: item.name ?? item.fileName ?? '',
      name: item.name ?? item.fileName ?? '',
      contentType: item.content_type ?? item.contentType ?? 'application/octet-stream',
      size: item.size_bytes ?? item.size ?? 0,
      sizeBytes: item.size_bytes ?? item.size ?? 0,
      url: item.file_key ?? item.url ?? '',
      externalUrl: item.external_url ?? item.externalUrl ?? null,
      description: item.description ?? null,
      isUploaded: item.is_uploaded ?? item.isUploaded ?? true,
      createdAt: item.created_at ?? item.createdAt,
      updatedAt: item.updated_at ?? item.updatedAt,
      isTrash: item.status === 'TRASHED' || (item.is_trash ?? item.isTrash ?? false),
      version: item.version ?? 1,
      _etag: etag,
    };
  };

  downloadUrl = async (_entityType: string, _entityId: string, documentId: string) => {
    try {
      const response = await instance.get<any>(
        `/storage/${documentId}/download-url`
      );
      const d = response.data;
      const downloadUrl =
        d.download_url ??
        d.downloadUrl ??
        `${instance.defaults.baseURL}/storage/${documentId}/download`;
      return {
        ...d,
        downloadUrl,
        download_url: downloadUrl,
        expiresIn: d.expires_in,
      };
    } catch {
      const fallbackUrl = `${instance.defaults.baseURL}/storage/${documentId}/download`;
      return {
        downloadUrl: fallbackUrl,
        download_url: fallbackUrl,
      };
    }
  };

  // ==========================================
  // 2. CICLO DE VIDA DE SUBIDA (UPLOAD)
  // ==========================================

  /**
   * Subida directa pasando por el backend (POST /storage/upload).
   * El back es quien habla con MinIO:9000, el navegador nunca toca
   * el bucket, por lo que no hay CORS contra MinIO ni URLs prefirmadas.
   */
  uploadDirect = async (
    entityType: string,
    entityId: string,
    file: File,
    description?: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    if (description) {
      formData.append('description', description.slice(0, 1000));
    }
    // Importante: `instance` tiene 'Content-Type: application/json' por defecto.
    // Si se usa para FormData, FastAPI ve JSON, no parsea el form y devuelve
    // 422 missing body.file/entity_type/entity_id. Por eso se usa axios limpio
    // (sin ese default): el navegador pone 'multipart/form-data; boundary=...'.
    const response = await axios.post(
      `${instance.defaults.baseURL}/storage/upload`,
      formData,
      {
        timeout: 120000,
        withCredentials: true,
      }
    );
    return response.data;
  };

  /**
   * Registro directo de URL externa (Google Drive, OneDrive, Dropbox, etc.)
   */
  addExternalUrl = async (
    entityType: string,
    entityId: string,
    data: { url: string; name: string; description?: string }
  ) => {
    const response = await instance.post(`/storage/url`, {
      entity_type: entityType,
      entity_id: entityId,
      url: data.url,
      name: data.name,
      description: data.description ? data.description.slice(0, 1000) : undefined,
    });
    return response.data;
  };

  // ==========================================
  // 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
  // ==========================================

  updateMetadata = async (
    _entityType: string,
    _entityId: string,
    documentId: string,
    data: { name?: string; fileName?: string; description?: string; isPublic?: boolean },
    options?: { ifMatch?: string }
  ) => {
    const payload: Record<string, any> = {};
    const name = data.name || data.fileName;
    if (name) payload.name = name;
    if (data.description !== undefined) payload.description = data.description?.slice(0, 1000) ?? null;

    const headers: Record<string, string> = {};
    if (options?.ifMatch) {
      headers['If-Match'] = options.ifMatch;
    }

    const response = await instance.patch(
      `/storage/${documentId}`,
      payload,
      { headers }
    );
    return response.data;
  };

  deleteSoftDocument = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.delete(
      `/storage/${documentId}`
    );
    return response.data;
  };

  restoreDocument = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.post(
      `/storage/${documentId}/restore`
    );
    return response.data;
  };

  // ==========================================
  // 4. ACCIONES MASIVAS (BULK)
  // ==========================================

  bulkDelete = async (entityType: string, entityId: string, documentIds: string[]) => {
    await Promise.all(documentIds.map((id) => this.deleteSoftDocument(entityType, entityId, id)));
    return { count: documentIds.length };
  };

  bulkRestore = async (entityType: string, entityId: string, documentIds: string[]) => {
    await Promise.all(documentIds.map((id) => this.restoreDocument(entityType, entityId, id)));
    return { count: documentIds.length };
  };

  bulkDownload = async (entityType: string, entityId: string, documentIds: string[]) => {
    return await this.bulkDownloadZip(entityType, entityId, documentIds);
  };

  bulkDownloadZip = async (_entityType: string, _entityId: string, documentIds: string[]) => {
    const response = await instance.post(
      `/storage/zip`,
      { storage_ids: documentIds },
      {
        responseType: 'blob',
        timeout: 120000,
      }
    );
    return response.data;
  };

  // ==========================================
  // 5. MANTENIMIENTO Y ELIMINACIÓN FÍSICA
  // ==========================================

  emptyTrash = async (_entityType: string, _entityId: string) => {
    const response = await instance.post(`/trash/purge-expired`);
    return response.data;
  };

  deletePermanent = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.delete(
      `/storage/${documentId}/permanent`
    );
    return response.data;
  };

  purgePendingUploads = async (olderThanSeconds?: number) => {
    const params: Record<string, any> = {};
    if (olderThanSeconds !== undefined) {
      params.older_than_seconds = olderThanSeconds;
    }
    const response = await instance.delete(`/storage/pending/purge`, { params });
    return response.data;
  };
}

export default new StorageService();
