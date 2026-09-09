import axios from 'axios';

import instance from '@/config/api';
import { GetDocumentsQuery, RequestUploadParams } from '@/schemas/storage.schema';

class StorageService {
  // ==========================================
  // 1. CONSULTAS Y LECTURA
  // ==========================================

  getDocuments = async (entityType: string, entityId: string, query: GetDocumentsQuery) => {
    const response = await instance.get(`/storage/${entityType}/${entityId}/documents`, {
      params: query,
    });
    return response.data;
  };

  getDocumentDetail = async (entityType: string, entityId: string, documentId: string) => {
    const response = await instance.get(`/storage/${entityType}/${entityId}/${documentId}`);
    return response.data;
  };

  downloadUrl = async (entityType: string, entityId: string, documentId: string) => {
    const response = await instance.get(
      `/storage/${entityType}/${entityId}/${documentId}/download-url`
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
    const response = await instance.post(`/storage/${entityType}/${entityId}/upload-url`, {
      fileData: data,
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
  confirmDocument = async (entityType: string, entityId: string, documentId: string) => {
    const response = await instance.patch(
      `/storage/${entityType}/${entityId}/${documentId}/confirm-document`
    );
    return response.data;
  };

  // ==========================================
  // 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
  // ==========================================

  updateMetadata = async (
    entityType: string,
    entityId: string,
    documentId: string,
    data: { fileName?: string; isPublic?: boolean }
  ) => {
    const response = await instance.patch(
      `/storage/${entityType}/${entityId}/${documentId}/metadata`,
      data
    );
    return response.data;
  };

  deleteSoftDocument = async (entityType: string, entityId: string, documentId: string) => {
    const response = await instance.patch(
      `/storage/${entityType}/${entityId}/${documentId}/delete-soft-document`
    );
    return response.data;
  };

  restoreDocument = async (entityType: string, entityId: string, documentId: string) => {
    const response = await instance.patch(
      `/storage/${entityType}/${entityId}/${documentId}/restore-document`
    );
    return response.data;
  };

  // ==========================================
  // 4. ACCIONES MASIVAS (BULK)
  // ==========================================

  bulkDelete = async (entityType: string, entityId: string, documentIds: string[]) => {
    const response = await instance.patch(`/storage/${entityType}/${entityId}/bulk-delete`, {
      documentIds,
    });
    return response.data;
  };

  bulkRestore = async (entityType: string, entityId: string, documentIds: string[]) => {
    const response = await instance.patch(`/storage/${entityType}/${entityId}/bulk-restore`, {
      documentIds,
    });
    return response.data;
  };

  bulkDownload = async (entityType: string, entityId: string, documentIds: string[]) => {
    const response = await instance.post(`/storage/${entityType}/${entityId}/bulk-download`, {
      documentIds,
    });
    return response.data;
  };

  bulkDownloadZip = async (entityType: string, entityId: string, documentIds: string[]) => {
    const response = await instance.post(
      `/storage/${entityType}/${entityId}/bulk-download-zip`,
      { documentIds },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  };

  // ==========================================
  // 5. MANTENIMIENTO Y ELIMINACIÓN FÍSICA
  // ==========================================

  emptyTrash = async (entityType: string, entityId: string) => {
    const response = await instance.delete(`/storage/${entityType}/${entityId}/empty-trash`);
    return response.data;
  };

  deletePermanent = async (entityType: string, entityId: string, documentId: string) => {
    const response = await instance.delete(
      `/storage/${entityType}/${entityId}/${documentId}/delete-document`
    );
    return response.data;
  };
}

export default new StorageService();
