import axios from 'axios';

import instance from '@/config/api';
import { GetDocumentsQuery, RequestUploadParams } from '@/schemas/storage.schema';

class StorageService {
  // ==========================================
  // 1. CONSULTAS Y LECTURA
  // ==========================================

  getDocuments = async (entityType: string, entityId: string, query?: GetDocumentsQuery) => {
    const response = await instance.get(`/storage/documents`, {
      params: { ...query, entity_type: entityType, entity_id: entityId },
    });
    return response.data;
  };

  getDocumentDetail = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.get(`/storage/documents/${documentId}`);
    return response.data;
  };

  downloadUrl = async (_entityType: string, _entityId: string, documentId: string) => {
    const response = await instance.get(
      `/storage/documents/${documentId}/download-url`
    );
    return response.data;
  };

  // ==========================================
  // 2. CICLO DE VIDA DE SUBIDA (UPLOAD)
  // ==========================================

  /**
   * Paso 1: Obtener la URL firmada de S3/GCS y crear registro PENDING
   */
  requestUploadUrl = async (entityType: string, entityId: string, data: RequestUploadParams) => {
    const response = await instance.post(`/storage/documents/presigned-upload`, {
      filename: data.fileName,
      content_type: data.mimeType,
      file_size: data.size,
      entity_type: entityType,
      entity_id: entityId,
      description: (data as any).description,
    });
    return response.data;
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
