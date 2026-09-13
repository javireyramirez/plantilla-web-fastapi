import axios from 'axios';

import instance from '@/config/api';
import { GetDocumentsQuery, RequestUploadParams } from '@/schemas/storage.schema';

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
      apiParams.content_type = query.contentTypes.join(',');
    }
    if (query?.sizeMin !== undefined) apiParams.size_min = query.sizeMin;
    if (query?.sizeMax !== undefined) apiParams.size_max = query.sizeMax;
    if (query?.isTrash !== undefined) apiParams.is_trash = query.isTrash;

    const response = await instance.get<any>(`/storage/documents`, {
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
      isUploaded: item.is_uploaded ?? item.isUploaded ?? true,
      createdAt: item.created_at ?? item.createdAt,
      updatedAt: item.updated_at ?? item.updatedAt,
      isTrash: item.is_trash ?? item.isTrash ?? false,
      entityType: item.entity_type ?? item.entityType,
      entityId: item.entity_id ?? item.entityId,
      modulePrincipalEntity: item.module_principal_entity ?? item.modulePrincipalEntity ?? null,
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
    const response = await instance.get<any>(`/storage/documents/${documentId}`);
    const item = response.data;
    return {
      id: item.id,
      fileName: item.name ?? item.fileName ?? '',
      name: item.name ?? item.fileName ?? '',
      contentType: item.content_type ?? item.contentType ?? 'application/octet-stream',
      size: item.size_bytes ?? item.size ?? 0,
      sizeBytes: item.size_bytes ?? item.size ?? 0,
      url: item.file_key ?? item.url ?? '',
      isUploaded: item.is_uploaded ?? item.isUploaded ?? true,
      createdAt: item.created_at ?? item.createdAt,
      updatedAt: item.updated_at ?? item.updatedAt,
      isTrash: item.is_trash ?? item.isTrash ?? false,
    };
  };

  downloadUrl = async (_entityType: string, _entityId: string, documentId: string) => {
    try {
      const response = await instance.get<any>(
        `/storage/documents/${documentId}/download-url`
      );
      const d = response.data;
      const downloadUrl =
        d.download_url ??
        d.downloadUrl ??
        `${instance.defaults.baseURL}/storage/documents/${documentId}/download`;
      return {
        ...d,
        downloadUrl,
        download_url: downloadUrl,
      };
    } catch {
      const fallbackUrl = `${instance.defaults.baseURL}/storage/documents/${documentId}/download`;
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
   * Subida directa al servidor (POST /storage/documents/upload), evitando CORS con S3/MinIO
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
      formData.append('description', description);
    }
    const response = await instance.post(`/storage/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  /**
   * Paso 1: Obtener la URL firmada de S3/GCS y crear registro PENDING
   */
  requestUploadUrl = async (entityType: string, entityId: string, data: RequestUploadParams) => {
    const response = await instance.post(`/storage/documents/presigned-upload`, {
      name: data.fileName,
      filename: data.fileName,
      content_type: data.mimeType,
      size_bytes: data.size,
      file_size: data.size,
      entity_type: entityType,
      entity_id: entityId,
      description: (data as any).description,
    });
    const d = response.data;
    return {
      ...d,
      uploadUrl: d.upload_url ?? d.uploadUrl,
      documentId: d.document_id ?? d.documentId,
    };
  };

  /**
   * Paso 2: Subir el archivo binario directamente al proveedor de nube
   */
  uploadToBucket = async (uploadUrl: string, file: File) => {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
    return response.status;
  };

  /**
   * Paso 3: Confirmar al backend que la subida fue exitosa (pasa a SUCCESS)
   */
  confirmDocument = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.post(
      `/storage/documents/${documentId}/confirm`
    );
    return response.data;
  };

  // ==========================================
  // 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
  // ==========================================

  updateMetadata = async (
    _entityType: string,
    _entityId: string,
    documentId: string,
    data: { fileName?: string; isPublic?: boolean }
  ) => {
    const response = await instance.patch(
      `/storage/documents/${documentId}`,
      data
    );
    return response.data;
  };

  deleteSoftDocument = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.delete(
      `/storage/documents/${documentId}`
    );
    return response.data;
  };

  restoreDocument = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.post(
      `/storage/documents/${documentId}/restore`
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
      `/storage/documents/zip`,
      { document_ids: documentIds },
      {
        responseType: 'blob',
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
      `/storage/documents/${documentId}/permanent`
    );
    return response.data;
  };
}

export default new StorageService();
