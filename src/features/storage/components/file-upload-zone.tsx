import { FileText, LoaderCircle, UploadCloud, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { FileUploadConfigProps, useFileUploadLogic } from '../model/use-file-upload-logic';

export function FileUploadZone(props: FileUploadConfigProps) {
  const { t } = useTranslation();
  const {
    files,
    isPendingUpload,
    executeUpload,
    removeFile,
    getRootProps,
    getInputProps,
    isDragActive,
  } = useFileUploadLogic(props);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-12 transition-all duration-200 cursor-pointer',
          'hover:bg-accent/50 hover:border-primary/50',
          isDragActive ? 'border-primary bg-accent' : 'border-muted-foreground/25',
          isPendingUpload && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="p-3 rounded-full bg-primary/10">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive
                ? t('storage.dropzone.dropActive')
                : props.multiple
                  ? t('storage.dropzone.clickDragMultiple')
                  : t('storage.dropzone.clickDragSingle')}
            </p>
            <p className="text-xs text-muted-foreground">{t('storage.dropzone.maxSizeInfo')}</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="p-4 border rounded-md flex items-center justify-between bg-card"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm truncate font-medium">{file.name}</span>
              </div>

              {isPendingUpload && props.autoUpload ? (
                <LoaderCircle className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={isPendingUpload}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!props.autoUpload && files.length > 0 && (
        <Button
          className="mt-3 w-full"
          onClick={() => executeUpload(files)}
          disabled={isPendingUpload}
        >
          {isPendingUpload ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              {t('storage.uploading')}
            </>
          ) : props.multiple && files.length > 1 ? (
            t('storage.dropzone.uploadMultipleCount', { count: files.length })
          ) : (
            t('storage.dropzone.uploadSingle')
          )}
        </Button>
      )}
    </div>
  );
}
