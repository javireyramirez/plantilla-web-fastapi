import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CrudService } from '@/services/crud.service';
import { useJobStream } from '@/modules/notifications/hooks/use-job-stream';
import { jobsQueries } from '@/modules/jobs/model/jobs.query';
import type { JobCompletedEvent, JobFailedEvent, JobProgressEvent } from '@/modules/notifications/model/notifications.types';
import type { ImportFormat, ImportMode, ImportResult } from '@/types/import.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

class DynamicCrudService extends CrudService<any> {
  constructor(entityName: string) {
    super(entityName);
  }
}

export interface ImportDialogProps {
  entityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompleted?: (result: ImportResult) => void;
  title?: string;
  description?: string;
}

type DialogStage = 'config' | 'uploading' | 'processing' | 'results';

export function ImportDialog({
  entityName,
  open,
  onOpenChange,
  onImportCompleted,
  title,
  description,
}: ImportDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const service = React.useMemo(() => new DynamicCrudService(entityName), [entityName]);

  // Form & Config states
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<ImportMode>('atomic');
  const [dryRun, setDryRun] = React.useState<boolean>(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState<boolean>(false);

  // Execution states
  const [stage, setStage] = React.useState<DialogStage>('config');
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);
  const [progressMessage, setProgressMessage] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reset dialog state
  const resetState = React.useCallback(() => {
    setSelectedFile(null);
    setMode('atomic');
    setDryRun(false);
    setStage('config');
    setJobId(null);
    setProgress(0);
    setProgressMessage(null);
    setImportResult(null);
    setErrorMessage(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (stage === 'uploading' || stage === 'processing') {
      // Evitar cierre accidental durante la ejecución
      return;
    }
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  // 1. Manejo de Dropzone
  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.file.size > MAX_FILE_SIZE) {
          toast.error(
            t('import.errors.fileTooLarge', {
              defaultValue: 'El archivo excede el tamaño máximo permitido de 10 MB.',
            })
          );
        } else {
          toast.error(
            t('import.errors.invalidFileType', {
              defaultValue: 'Formato de archivo inválido. Solo se admiten archivos .xlsx y .csv.',
            })
          );
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
      }
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    disabled: stage !== 'config',
  });

  // 2. Descarga de Plantilla
  const handleDownloadTemplate = async (format: ImportFormat) => {
    setIsDownloadingTemplate(true);
    try {
      await service.downloadImportTemplate(format);
      toast.success(
        t('common.downloadSuccess', {
          defaultValue: 'Plantilla descargada correctamente',
        })
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(
        msg ||
          t('import.errors.downloadTemplateFailed', {
            defaultValue: 'Error al descargar la plantilla de importación.',
          })
      );
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // 3. Finalización con éxito o reporte de resultado
  const handleCompleteResult = React.useCallback(
    (result: ImportResult | null) => {
      setImportResult(result);
      setStage('results');
      setProgress(100);

      // Invalidar cache de la entidad para refrescar listados
      queryClient.invalidateQueries({ queryKey: [entityName] });

      if (result) {
        onImportCompleted?.(result);
        if (result.failed_rows === 0) {
          toast.success(
            t('import.results.successTitle', {
              defaultValue: '¡Importación completada con éxito!',
            })
          );
        } else if (result.imported_rows > 0) {
          toast.warning(
            t('import.results.partialTitle', {
              defaultValue: 'Importación finalizada con errores',
            })
          );
        } else {
          toast.error(
            t('import.results.failedTitle', {
              defaultValue: 'Error en la importación',
            })
          );
        }
      }
    },
    [entityName, queryClient, onImportCompleted, t]
  );

  // 4. Conexión SSE
  const handleStreamProgress = React.useCallback((event: JobProgressEvent) => {
    setProgress(event.progress);
    if (event.progress_message) {
      setProgressMessage(event.progress_message);
    }
  }, []);

  const handleStreamCompleted = React.useCallback(
    (event: JobCompletedEvent) => {
      const result = (event.result as ImportResult) ?? null;
      handleCompleteResult(result);
    },
    [handleCompleteResult]
  );

  const handleStreamFailed = React.useCallback(
    (event: JobFailedEvent) => {
      setErrorMessage(event.error || 'Error en la tarea de importación');
      setStage('results');
      queryClient.invalidateQueries({ queryKey: [entityName] });
      toast.error(
        event.error ||
          t('import.results.failedTitle', {
            defaultValue: 'Error en la importación',
          })
      );
    },
    [entityName, queryClient, t]
  );

  const { isConnected, hasError } = useJobStream({
    jobId: jobId || undefined,
    enabled: !!jobId && stage === 'processing',
    onProgress: handleStreamProgress,
    onCompleted: handleStreamCompleted,
    onFailed: handleStreamFailed,
  });

  // 5. Polling Fallback si SSE falla o no está conectado
  const pollingEnabled = !!jobId && stage === 'processing' && (hasError || !isConnected);
  const { data: polledJob } = jobsQueries.useGetById(jobId || '', {
    enabled: pollingEnabled,
    refetchInterval: pollingEnabled ? 2000 : false,
  });

  React.useEffect(() => {
    if (!pollingEnabled || !polledJob) return;

    setProgress(polledJob.progress);
    if (polledJob.progress_message) {
      setProgressMessage(polledJob.progress_message);
    }

    if (polledJob.status === 'COMPLETED') {
      handleCompleteResult((polledJob.result as ImportResult) ?? null);
    } else if (polledJob.status === 'FAILED' || polledJob.status === 'CANCELLED') {
      setErrorMessage(polledJob.error || 'Error en la ejecución del trabajo');
      setStage('results');
      queryClient.invalidateQueries({ queryKey: [entityName] });
    }
  }, [pollingEnabled, polledJob, handleCompleteResult, entityName, queryClient]);

  // 6. Subida e inicio del proceso
  const handleStartImport = async () => {
    if (!selectedFile) {
      toast.error(
        t('import.errors.noFileSelected', {
          defaultValue: 'Debes seleccionar un archivo para importar.',
        })
      );
      return;
    }

    setStage('uploading');
    setProgress(0);
    setProgressMessage(
      t('import.status.uploading', {
        defaultValue: 'Subiendo archivo al servidor...',
      })
    );

    try {
      const job = await service.uploadImport(selectedFile, { mode, dryRun });
      setJobId(job.id);
      setStage('processing');
      setProgress(job.progress || 0);
      setProgressMessage(
        job.progress_message ||
          t('import.status.processing', {
            defaultValue: 'Procesando importación en segundo plano...',
          })
      );
    } catch (err: any) {
      setStage('config');
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      toast.error(
        msg ||
          t('import.errors.uploadFailed', {
            defaultValue: 'Error al enviar el archivo de importación.',
          })
      );
    }
  };

  const isExecuting = stage === 'uploading' || stage === 'processing';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-lg font-bold">
                {title ||
                  t('import.dialogTitle', {
                    defaultValue: 'Importar registros',
                  })}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {description ||
                  t('import.dialogDescription', {
                    defaultValue:
                      'Sube un archivo Excel (.xlsx) o CSV (.csv) para procesar e insertar registros de forma masiva.',
                  })}
              </DialogDescription>
            </div>

            {/* Dropdown de Plantillas en Header */}
            {stage === 'config' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDownloadingTemplate}
                    className="gap-1.5 shrink-0 text-xs shadow-sm"
                  >
                    {isDownloadingTemplate ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span>
                      {t('import.downloadTemplate', {
                        defaultValue: 'Descargar plantilla',
                      })}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDownloadTemplate('excel')}
                    className="cursor-pointer text-xs py-2 gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>
                      {t('import.templateExcel', {
                        defaultValue: 'Plantilla Excel (.xlsx)',
                      })}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownloadTemplate('csv')}
                    className="cursor-pointer text-xs py-2 gap-2"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>
                      {t('import.templateCsv', {
                        defaultValue: 'Plantilla CSV (.csv)',
                      })}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ETAPA 1: CONFIGURACIÓN Y SUBIDA */}
          {stage === 'config' && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer text-center',
                  'hover:bg-accent/40 hover:border-primary/40',
                  isDragActive ? 'border-primary bg-accent/60' : 'border-muted-foreground/25',
                  selectedFile && 'border-emerald-500/50 bg-emerald-500/5'
                )}
              >
                <input {...getInputProps()} />

                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
                      <FileSpreadsheet className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground break-all">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground hover:text-destructive gap-1 mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>
                        {t('import.dropzone.changeFile', {
                          defaultValue: 'Cambiar archivo',
                        })}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {isDragActive
                          ? t('import.dropzone.dragActive', {
                              defaultValue: 'Suelta el archivo aquí...',
                            })
                          : t('import.dropzone.idle', {
                              defaultValue:
                                'Arrastra y suelta tu archivo aquí, o haz clic para seleccionarlo',
                            })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('import.dropzone.hint', {
                          defaultValue: 'Formatos soportados: .xlsx, .csv (máximo 10 MB)',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Opciones de Importación */}
              <div className="bg-muted/40 rounded-xl p-4 border space-y-4 text-xs">
                {/* Selector de Modo: Atómico vs Parcial */}
                <div className="space-y-2">
                  <Label className="font-semibold text-xs text-foreground">
                    {t('import.options.modeLabel', {
                      defaultValue: 'Modo de importación',
                    })}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('atomic')}
                      className={cn(
                        'flex flex-col text-left p-3 rounded-lg border transition-all',
                        mode === 'atomic'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-card hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-foreground">
                          {t('import.options.modeAtomic', {
                            defaultValue: 'Atómico (Todo o nada)',
                          })}
                        </span>
                        {mode === 'atomic' && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('import.options.modeAtomicDesc', {
                          defaultValue:
                            'Si falla una sola fila, se cancela la operación completa y no se crea ningún registro.',
                        })}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('partial')}
                      className={cn(
                        'flex flex-col text-left p-3 rounded-lg border transition-all',
                        mode === 'partial'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-card hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-foreground">
                          {t('import.options.modePartial', {
                            defaultValue: 'Parcial (Resiliente)',
                          })}
                        </span>
                        {mode === 'partial' && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('import.options.modePartialDesc', {
                          defaultValue:
                            'Inserta todas las filas válidas y genera un reporte detallado con las filas fallidas.',
                        })}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Switch Dry Run */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-0.5 pr-4">
                    <Label htmlFor="dry-run-switch" className="font-semibold text-xs text-foreground cursor-pointer">
                      {t('import.options.dryRun', {
                        defaultValue: 'Simular importación (Dry Run)',
                      })}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {t('import.options.dryRunDesc', {
                        defaultValue:
                          'Valida las reglas y datos sin insertar ningún registro en la base de datos.',
                      })}
                    </p>
                  </div>
                  <Switch
                    id="dry-run-switch"
                    checked={dryRun}
                    onCheckedChange={setDryRun}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: PROCESANDO / EN EJECUCIÓN */}
          {isExecuting && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 rounded-full bg-primary/10 text-primary animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>

              <div className="space-y-2 max-w-md w-full">
                <h3 className="font-semibold text-base text-foreground">
                  {stage === 'uploading'
                    ? t('import.status.uploading', { defaultValue: 'Subiendo archivo...' })
                    : t('import.status.processing', { defaultValue: 'Procesando importación...' })}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {progressMessage ||
                    (stage === 'processing'
                      ? t('jobs.autoRefreshNotice', { defaultValue: 'El estado se actualiza en tiempo real.' })
                      : '')}
                </p>
              </div>

              {/* Barra de Progreso Custom (Ponytail / Tailwind de jobs-detail) */}
              <div className="w-full max-w-sm space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>{stage === 'uploading' ? 'Cargando' : 'Progreso'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: RESULTADOS */}
          {stage === 'results' && (
            <div className="space-y-5">
              {/* Alerta de Estado Superior */}
              {errorMessage ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-destructive">
                      {t('import.results.failedTitle', { defaultValue: 'Error en la importación' })}
                    </h4>
                    <p className="text-xs text-muted-foreground">{errorMessage}</p>
                  </div>
                </div>
              ) : importResult ? (
                <>
                  {importResult.dry_run && (
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {t('import.results.dryRunNotice', {
                          defaultValue: 'Simulación completada (no se persistieron registros)',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Tarjetas Métricas */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-card p-3 text-center space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {t('import.results.totalRows', { defaultValue: 'Total filas' })}
                      </span>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {importResult.total_rows}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-3 text-center space-y-1">
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {t('import.results.importedRows', { defaultValue: 'Importadas' })}
                      </span>
                      <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {importResult.imported_rows}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'rounded-xl border p-3 text-center space-y-1',
                        importResult.failed_rows > 0
                          ? 'bg-rose-500/5 border-rose-500/20'
                          : 'bg-card'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[11px] font-medium uppercase tracking-wider',
                          importResult.failed_rows > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {t('import.results.failedRows', { defaultValue: 'Fallidas' })}
                      </span>
                      <p
                        className={cn(
                          'text-xl font-bold font-mono',
                          importResult.failed_rows > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-foreground'
                        )}
                      >
                        {importResult.failed_rows}
                      </p>
                    </div>
                  </div>

                  {/* Resumen de estado */}
                  <div className="flex items-center gap-2">
                    {importResult.failed_rows === 0 ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {t('import.results.successTitle', {
                            defaultValue: 'Todas las filas se procesaron correctamente.',
                          })}
                        </span>
                      </div>
                    ) : importResult.mode === 'atomic' ? (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Modo atómico: Se realizó un rollback total. No se insertó ningún registro.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Modo parcial: Se insertaron las filas válidas y se omitieron las fallidas.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tabla de Errores por Fila */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground">
                          {t('import.results.errorsTable.title', {
                            defaultValue: 'Detalle de filas con error',
                          })}
                        </Label>
                        {importResult.truncated && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                            {t('import.results.truncatedWarning', {
                              defaultValue: 'Primeros 100 errores mostrados',
                            })}
                          </Badge>
                        )}
                      </div>

                      <div className="border rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0 z-10 text-[11px]">
                            <TableRow>
                              <TableHead className="w-[70px] font-semibold text-center">
                                {t('import.results.errorsTable.row', { defaultValue: 'Fila' })}
                              </TableHead>
                              <TableHead className="w-[120px] font-semibold">
                                {t('import.results.errorsTable.field', { defaultValue: 'Campo' })}
                              </TableHead>
                              <TableHead className="font-semibold">
                                {t('import.results.errorsTable.message', { defaultValue: 'Error' })}
                              </TableHead>
                              <TableHead className="w-[120px] font-semibold">
                                {t('import.results.errorsTable.value', { defaultValue: 'Valor' })}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-xs font-mono">
                            {importResult.errors.map((err, idx) => (
                              <TableRow key={idx} className="hover:bg-muted/30">
                                <TableCell className="text-center font-bold text-muted-foreground">
                                  {err.row}
                                </TableCell>
                                <TableCell className="font-semibold text-foreground">
                                  {err.field}
                                </TableCell>
                                <TableCell className="text-rose-600 dark:text-rose-400 font-sans text-xs">
                                  {err.message}
                                </TableCell>
                                <TableCell className="truncate max-w-[120px] text-muted-foreground" title={String(err.value ?? '')}>
                                  {err.value !== undefined && err.value !== null ? String(err.value) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          {stage === 'config' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedFile}
                onClick={handleStartImport}
                className="gap-1.5 shadow-sm"
              >
                <UploadCloud className="h-4 w-4" />
                <span>
                  {dryRun
                    ? t('import.options.dryRun', { defaultValue: 'Simular importación' })
                    : t('import.button', { defaultValue: 'Importar' })}
                </span>
              </Button>
            </>
          ) : isExecuting ? (
            <div className="w-full flex justify-end">
              <span className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Por favor espera mientras se procesa el archivo...</span>
              </span>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={resetState}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>
                  {t('import.results.importAnother', {
                    defaultValue: 'Importar otro archivo',
                  })}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                {t('import.results.close', { defaultValue: 'Cerrar' })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
