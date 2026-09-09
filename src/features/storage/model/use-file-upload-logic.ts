import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallback, useState } from 'react';

import { useUploadFile } from '@/features/storage/model/use-storage';

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
        onError: (error) => {
          console.log(error?.message);
          toast.error(t('storage.toast.uploadError'));
        },
      });
    },
    [multiple, entityType, entityId, mutateUpload, onSuccess, t]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      let currentFiles = acceptedFiles;

      if (multiple) {
        setFiles((prev) => {
          currentFiles = [...prev, ...acceptedFiles];
          return currentFiles;
          return currentFiles;
        });
      } else {
        setFiles([acceptedFiles[0]]);
        currentFiles = [acceptedFiles[0]];
      }

      if (autoUpload) {
        executeUpload(currentFiles);
      }
    },
    [multiple, autoUpload, executeUpload]
  );

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const dropzone = useDropzone({
    onDrop,
    multiple,
    disabled: isPendingUpload,
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
  });

  return {
    files,
    isPendingUpload,
    executeUpload,
    removeFile,
    ...dropzone, // exporta getRootProps, getInputProps, isDragActive, etc.
  };
}
