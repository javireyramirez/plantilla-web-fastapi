import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import storageService from '@/features/storage/model/storage.service';
import { GetDocumentsQuery } from '@/schemas/storage.schema';

// ==========================================
// 1. CONSULTAS Y LECTURA
// ==========================================

export const useGetDocuments = (entityType: string, entityId: string, query: GetDocumentsQuery) => {
  return useQuery({
    queryKey: ['documents', entityType, entityId, query],
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
        // Paso A: Pedir URL
        const { uploadUrl, documentId } = await storageService.requestUploadUrl(
          entityType,
          entityId,
          {
            fileName: currentFile.name,
            mimeType: currentFile.type,
            size: currentFile.size,
            isPublic: false,
          }
        );

        // Paso B: Subir al bucket
        await storageService.uploadToBucket(uploadUrl, currentFile);

        // Paso C: Confirmar
        return await storageService.confirmDocument(entityType, entityId, documentId);
      });

      return await Promise.all(uploadPromises);
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
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
    }: {
      entityType: string;
      entityId: string;
      documentId: string;
      data: { fileName?: string; isPublic?: boolean };
    }) => storageService.updateMetadata(entityType, entityId, documentId, data),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
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
    onSuccess: async (data) => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const [index, { downloadUrl, fileName }] of data.entries()) {
        if (index > 0) await sleep(300);

        try {
          // Fetch the file and create a local blob URL
          // This prevents the browser from intercepting PDFs and opening them inline
          const response = await fetch(downloadUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Revoke the blob URL after a short delay to free memory
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch {
          console.error(`Error downloading ${fileName}`);
        }
      }
    },
  });
};

export const useBulkDownloadZip = () => {
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentIds,
    }: {
      entityType: string;
      entityId: string;
      documentIds: string[];
    }) => storageService.bulkDownloadZip(entityType, entityId, documentIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/zip' }));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documentos_${Date.now()}.zip`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Error al descargar ZIP:', error);
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
