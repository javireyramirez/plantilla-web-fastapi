import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallback, useMemo, useState } from 'react';

import { useUploadFile } from '@/features/storage/model/use-storage';
import { useSettings } from '@/hooks/use-settings';
import { formatBytes } from '@/lib/format';

export interface FileUploadConfigProps {
  entityType: string;
  entityId: string;
  onSuccess?: () => void;
  multiple?: boolean;
  autoUpload?: boolean;
}

export function useFileUploadLogic({
  entityType,
  entityId,
  onSuccess,
  multiple = false,
  autoUpload = false,
}: FileUploadConfigProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const { isPending: isPendingUpload, mutate: mutateUpload } = useUploadFile();
  const {
    maxUploadSizeBytes,
    fileCategories,
    allowedMimetypes,
    allowedExtensions,
    isLoading: isLoadingSettings,
  } = useSettings();

  const executeUpload = useCallback(
    (filesToUpload: File[]) => {
      if (filesToUpload.length === 0) return;

      const payload = multiple
        ? { entityType, entityId, files: filesToUpload }
        : { entityType, entityId, file: filesToUpload[0] };

      mutateUpload(payload as any, {
        onSuccess: () => {
          toast.success(
            multiple && filesToUpload.length > 1
              ? t('storage.toast.uploadSuccessMultiple')
              : t('storage.toast.uploadSuccessSingle')
          );
          setFiles([]);
          onSuccess?.();
        },
        onError: (error: any) => {
          console.error(error?.message);
          const status = error?.response?.status;
          const serverDetail = error?.response?.data?.detail || error?.response?.data?.message;
          if (status === 413 && serverDetail) {
            toast.error(serverDetail);
          } else if (status === 403) {
            toast.error(serverDetail || 'No tienes permisos para adjuntar archivos a esta entidad');
          } else if (status === 404) {
            toast.error(serverDetail || 'La entidad o recurso destino no existe');
          } else {
            toast.error(serverDetail || t('storage.toast.uploadError'));
          }
        },
      });
    },
    [multiple, entityType, entityId, mutateUpload, onSuccess, t]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const validFiles: File[] = [];

      for (const file of acceptedFiles) {
        if (file.size > maxUploadSizeBytes) {
          toast.error(
            t('storage.toast.fileTooLarge', {
              name: file.name,
              size: formatBytes(maxUploadSizeBytes),
              defaultValue: `El archivo "${file.name}" supera el tamaño máximo permitido (${formatBytes(maxUploadSizeBytes)})`,
            })
          );
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      let currentFiles = validFiles;

      if (multiple) {
        setFiles((prev) => {
          currentFiles = [...prev, ...validFiles];
          return currentFiles;
        });
      } else {
        setFiles([validFiles[0]]);
        currentFiles = [validFiles[0]];
      }

      if (autoUpload) {
        executeUpload(currentFiles);
      }
    },
    [multiple, autoUpload, executeUpload, maxUploadSizeBytes, t]
  );

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Generación dinámica del objeto accept a partir de los settings del backend
  const accept = useMemo((): Record<string, string[]> | undefined => {
    if (fileCategories && fileCategories.length > 0) {
      const map: Record<string, string[]> = {};
      for (const cat of fileCategories) {
        const exts = (cat.extensions || []).map((e) => (e.startsWith('.') ? e : `.${e}`));
        for (const mime of cat.mimes || []) {
          if (!map[mime]) {
            map[mime] = [];
          }
          map[mime] = Array.from(new Set([...map[mime], ...exts]));
        }
      }
      return map;
    }

    if (allowedMimetypes && allowedMimetypes.length > 0) {
      const map: Record<string, string[]> = {};
      const formattedExts = (allowedExtensions || []).map((e) =>
        e.startsWith('.') ? e : `.${e}`
      );
      for (const mime of allowedMimetypes) {
        map[mime] = formattedExts;
      }
      return map;
    }

    return undefined;
  }, [fileCategories, allowedMimetypes, allowedExtensions]);

  const dropzone = useDropzone({
    onDrop,
    multiple,
    disabled: isPendingUpload || isLoadingSettings,
    accept,
    maxSize: maxUploadSizeBytes,
  });

  return {
    files,
    isPendingUpload,
    executeUpload,
    removeFile,
    maxUploadSizeBytes,
    fileCategories,
    isLoadingSettings,
    ...dropzone, // exporta getRootProps, getInputProps, isDragActive, etc.
  };
}

