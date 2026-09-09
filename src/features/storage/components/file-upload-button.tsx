import { LoaderCircle, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { FileUploadConfigProps, useFileUploadLogic } from '../model/use-file-upload-logic';

interface FileUploadButtonProps extends Omit<FileUploadConfigProps, 'autoUpload'> {
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function FileUploadButton({
  label,
  variant = 'default',
  size = 'default',
  ...props
}: FileUploadButtonProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t('storage.uploadFile');

  const { getRootProps, getInputProps, isPendingUpload } = useFileUploadLogic({
    ...props,
    autoUpload: true, // Forzamos a true para que el botón sea inmediato
  });

  return (
    <div {...getRootProps()} className="inline-block">
      {/* Ocultamos el input pero permitimos que Dropzone lo maneje */}
      <input {...getInputProps()} />
      <Button type="button" variant={variant} size={size} disabled={isPendingUpload}>
        {isPendingUpload ? (
          <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {isPendingUpload ? t('storage.uploading') : displayLabel}
      </Button>
    </div>
  );
}
