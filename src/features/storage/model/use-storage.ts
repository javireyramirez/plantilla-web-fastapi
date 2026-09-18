import i18n from 'i18next';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import storageService from '@/features/storage/model/storage.service';
import { trackJob, triggerFileDownload } from '@/modules/jobs/model/job-tracker';
import { GetDocumentsQuery } from '@/schemas/storage.schema';

// ==========================================
// 1. CONSULTAS Y LECTURA
// ==========================================

export const useGetDocuments = (entityType?: string, entityId?: string, query?: GetDocumentsQuery) => {
  return useQuery({
    queryKey: ['documents', entityType ?? '', entityId ?? '', query],
    queryFn: () => storageService.getDocuments(entityType, entityId, query),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
};

export const useGetDocumentDetail = (entityType: string, entityId: string, documentId: string) => {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: () => storageService.getDocumentDetail(entityType, entityId, documentId),
    enabled: !!documentId,
  });
};

export const useDownloadUrl = () => {
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
    }: {
      entityType: string;
      entityId: string;
      documentId: string;
    }) => storageService.downloadUrl(entityType, entityId, documentId),
    onSuccess: (data) => {
      window.open(data.downloadUrl, '_blank');
    },
  });
};

// ==========================================
// 2. CICLO DE VIDA DE SUBIDA (UPLOAD)
// ==========================================

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      file,
      files,
    }: {
      entityType: string;
      entityId: string;
      file?: File;
      files?: File[];
    }) => {
      const filesToProcess = files || (file ? [file] : []);
      if (filesToProcess.length === 0) throw new Error('No se han proporcionado archivos');

      const uploadPromises = filesToProcess.map(async (currentFile) => {
        return await storageService.uploadDirect(entityType, entityId, currentFile);
      });

      return await Promise.all(uploadPromises);
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useAddExternalUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      data,
    }: {
      entityType: string;
      entityId: string;
      data: { url: string; name: string; description?: string };
    }) => storageService.addExternalUrl(entityType, entityId, data),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

// ==========================================
// 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
// ==========================================

export const useUpdateDocumentMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
      data,
      ifMatch,
    }: {
      entityType: string;
      entityId: string;
      documentId: string;
      data: { name?: string; fileName?: string; description?: string; isPublic?: boolean };
      ifMatch?: string;
    }) => storageService.updateMetadata(entityType, entityId, documentId, data, { ifMatch }),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteSoftDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
    }: {
      entityType: string;
      entityId: string;
      documentId: string;
    }) => storageService.deleteSoftDocument(entityType, entityId, documentId),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
  });
};

export const useRestoreDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
    }: {
      entityType: string;
      entityId: string;
      documentId: string;
    }) => storageService.restoreDocument(entityType, entityId, documentId),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
  });
};

// ==========================================
// 4. ACCIONES MASIVAS (BULK)
// ==========================================

export const useBulkDeleteDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentIds,
    }: {
      entityType: string;
      entityId: string;
      documentIds: string[];
    }) => storageService.bulkDelete(entityType, entityId, documentIds),
    onSuccess: (_, { entityType, entityId, documentIds }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      const count = documentIds.length;
      const message =
        count === 1
          ? '1 documento movido a la papelera'
          : `${count} documentos movidos a la papelera`;
    },
  });
};

export const useBulkRestoreDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentIds,
    }: {
      entityType: string;
      entityId: string;
      documentIds: string[];
    }) => storageService.bulkRestore(entityType, entityId, documentIds),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
  });
};

function triggerZipBlobDownload(blobData: any, filename?: string) {
  const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `documentos_${Date.now()}.zip`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export const useBulkDownloadUrls = () => {
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentIds,
    }: {
      entityType: string;
      entityId: string;
      documentIds: string[];
    }) => storageService.bulkDownload(entityType, entityId, documentIds),
    onSuccess: (data) => {
      triggerZipBlobDownload(data);
    },
    onError: (error) => {
      console.error('Error al descargar ZIP:', error);
    },
  });
};

export const useBulkDownloadZip = () => {
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentIds,
      archiveName,
      asyncJob,
    }: {
      entityType: string;
      entityId: string;
      documentIds: string[];
      archiveName?: string;
      asyncJob?: boolean;
    }) => storageService.bulkDownloadZip(entityType, entityId, documentIds, archiveName, asyncJob),
    onSuccess: (data: any, variables) => {
      if (data && 'id' in data && 'status' in data) {
        // Modo asíncrono (HTTP 202)
        toast.info(
          i18n.t('storage.zipAsyncStarted', { defaultValue: 'Generando archivo ZIP en segundo plano...' })
        );
        trackJob(data.id, {
          onCompleted: (result) => {
            if (result?.download_url) {
              triggerFileDownload(result.download_url, result.filename || variables.archiveName || 'adjuntos.zip');
              toast.success(
                i18n.t('storage.zipAsyncCompleted', { defaultValue: 'Archivo ZIP listo. Descargando...' })
              );
            }
          },
          onFailed: (err) => {
            toast.error(
              err || i18n.t('storage.zipAsyncFailed', { defaultValue: 'Error al generar el archivo ZIP en segundo plano' })
            );
          },
        });
      } else {
        triggerZipBlobDownload(data, variables.archiveName);
      }
    },
    onError: (error: any) => {
      console.error('Error al descargar ZIP:', error);
      const detail = error?.response?.data?.detail || error?.response?.data?.message;
      toast.error(detail || 'Error al descargar ZIP');
    },
  });
};
// ==========================================
// 5. MANTENIMIENTO Y ELIMINACIÓN FÍSICA
// ==========================================

export const useEmptyTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: string; entityId: string }) =>
      storageService.emptyTrash(entityType, entityId),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
  });
};

export const useDeletePermanentDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
    }: {
      entityType: string;
      entityId: string;
      documentId: string;
    }) => storageService.deletePermanent(entityType, entityId, documentId),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
  });
};

export const usePurgePendingUploads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (olderThanSeconds?: number) =>
      storageService.purgePendingUploads(olderThanSeconds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(
        data?.purged !== undefined
          ? `${data.purged} archivos pendientes purgados`
          : 'Archivos pendientes purgados'
      );
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || error?.response?.data?.message;
      toast.error(detail || 'Error al purgar archivos pendientes');
    },
  });
};
