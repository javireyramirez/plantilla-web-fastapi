import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  FileCode,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/use-permissions';
import { useModules } from '@/modules/modules/model/modules.query';
import { getAuditModuleLabel, getEntityLink, normalizeModuleSlug } from '@/modules/audit/model/audit.types';

import { JobConfirmDialog } from '../components/job-confirm-dialog';
import { JobStatusBadge } from '../components/job-status-badge';
import { formatJobDuration, formatRelativeTime } from '../model/jobs.types';
import { useJobDetail } from '../model/use-job-detail';

export default function JobsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { modulesMap } = useModules();

  const canUpdate = can('jobs', 'UPDATE');
  const canSettings = can('jobs', 'SETTINGS');

  const {
    job,
    isLoading,
    isFetching,
    refetch,
    handleCancel,
    isPendingCancel,
    handleRetry,
    isPendingRetry,
  } = useJobDetail(id);

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    action: 'cancel' | 'retry';
    title: string;
    description: string;
    confirmText: string;
    variant: 'default' | 'destructive';
  }>({
    open: false,
    action: 'cancel',
    title: '',
    description: '',
    confirmText: '',
    variant: 'default',
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t('common.copied', { defaultValue: 'Copiado al portapapeles' }));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.action === 'cancel') {
      await handleCancel();
    } else {
      await handleRetry();
    }
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-64 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Skeleton className="h-80 lg:col-span-1" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-card text-center gap-4">
        <Info className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">{t('jobs.notFoundTitle', { defaultValue: 'Tarea no encontrada' })}</h2>
        <p className="text-muted-foreground">
          {t(
            'jobs.notFoundDesc',
            { defaultValue: 'La tarea solicitada no existe o no cuenta con los permisos necesarios para verla.' }
          )}
        </p>
        <Button onClick={() => navigate('/admin/jobs')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', { defaultValue: 'Volver' })}
        </Button>
      </div>
    );
  }

  const isCancellable = job.status === 'PENDING' || job.status === 'RUNNING';
  const isRetryable = job.status === 'FAILED' || job.status === 'CANCELLED';

  const formatIsoDate = (isoDate?: string | Date | null) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const entitySlug = job.entity_type ? normalizeModuleSlug(job.entity_type) : null;
  const entityLink = entitySlug && job.entity_id ? getEntityLink(entitySlug, job.entity_id) : null;
  const entityLabel = entitySlug ? getAuditModuleLabel(t, entitySlug, modulesMap) : job.entity_type;

  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb y Acciones de cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/admin/jobs">{t('jobs.title', { defaultValue: 'Tareas Asíncronas' })}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                {t('jobs.detail', { defaultValue: 'Detalle' })}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-sm"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', { defaultValue: 'Refrescar' })}</span>
          </Button>

          {canUpdate && isCancellable && (
            <Button
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  action: 'cancel',
                  title: t('jobs.dialog.cancelTitle', { defaultValue: '¿Cancelar tarea en segundo plano?' }),
                  description: t(
                    'jobs.dialog.cancelDescription',
                    { defaultValue: 'La tarea detendrá su ejecución cooperativa y su estado pasará a CANCELADO.' }
                  ),
                  confirmText: t('jobs.dialog.confirmCancel', { defaultValue: 'Cancelar tarea' }),
                  variant: 'destructive',
                })
              }
              variant="destructive"
              size="sm"
              className="gap-1.5 shadow-sm"
              disabled={isPendingCancel}
            >
              <Ban className="h-4 w-4" />
              <span>{t('jobs.actions.cancel', { defaultValue: 'Cancelar tarea' })}</span>
            </Button>
          )}

          {canSettings && isRetryable && (
            <Button
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  action: 'retry',
                  title: t('jobs.dialog.retryTitle', { defaultValue: '¿Reintentar tarea?' }),
                  description: t(
                    'jobs.dialog.retryDescription',
                    { defaultValue: 'Se reprogramará la tarea nuevamente con estado PENDIENTE para su ejecución inmediata por los workers.' }
                  ),
                  confirmText: t('jobs.dialog.confirmRetry', { defaultValue: 'Reintentar tarea' }),
                  variant: 'default',
                })
              }
              variant="default"
              size="sm"
              className="gap-1.5 shadow-sm"
              disabled={isPendingRetry}
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t('jobs.actions.retry', { defaultValue: 'Reintentar tarea' })}</span>
            </Button>
          )}

          <Button
            onClick={() => navigate('/admin/jobs')}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-none shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', { defaultValue: 'Volver' })}
          </Button>
        </div>
      </div>

      {/* SECCIÓN: Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Loader2
              className={`h-5 w-5 text-muted-foreground flex-shrink-0 ${
                job.status === 'RUNNING' ? 'animate-spin text-blue-500' : ''
              }`}
            />
            <h1 className="text-xl font-bold tracking-tight text-foreground">{job.name}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {job.progress_message ? (
              <span>{job.progress_message} &bull; </span>
            ) : null}
            {t('jobs.progress', { defaultValue: 'Progreso' })}: {job.progress}%
          </p>
        </div>

        <div className="w-full sm:w-60 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{job.progress}%</span>
            <span>{formatJobDuration(job.started_at, job.completed_at)}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                job.status === 'FAILED'
                  ? 'bg-rose-500'
                  : job.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: Grilla 1/3 (Detalles) + 2/3 (Pestañas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Información General */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              {t('jobs.details', { defaultValue: 'Detalles de la tarea' })}
            </CardTitle>
            <CardDescription>
              {t(
                'jobs.detailsDescription',
                { defaultValue: 'Metadatos, ciclo de ejecución y tiempos del background job.' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border text-sm pt-0">
            {/* Estado */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.status.label', { defaultValue: 'Estado' })}
              </span>
              <div>
                <JobStatusBadge status={job.status} />
              </div>
            </div>

            {/* Progreso */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.progress', { defaultValue: 'Progreso' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{job.progress}%</span>
                {job.progress_message && (
                  <span className="text-xs text-muted-foreground truncate">({job.progress_message})</span>
                )}
              </div>
            </div>

            {/* Intentos */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.attempts', { defaultValue: 'Intentos' })}
              </span>
              <span className="text-foreground font-medium font-mono">
                {job.attempts} / {job.max_retries}
              </span>
            </div>

            {/* Duración */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.duration', { defaultValue: 'Duración total' })}
              </span>
              <span className="text-foreground font-medium font-mono">
                {formatJobDuration(job.started_at, job.completed_at)}
              </span>
            </div>

            {/* Fecha de Creación */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.createdAt', { defaultValue: 'Fecha de creación' })}
              </span>
              <span className="text-foreground font-medium">{formatIsoDate(job.created_at)}</span>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(job.created_at)}</span>
            </div>

            {/* Programado para */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.scheduledAt', { defaultValue: 'Programado para' })}
              </span>
              <span className="text-foreground font-medium">{formatIsoDate(job.scheduled_at)}</span>
            </div>

            {/* Inicio de ejecución */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.startedAt', { defaultValue: 'Inicio de ejecución' })}
              </span>
              <span className="text-foreground font-medium">{formatIsoDate(job.started_at)}</span>
            </div>

            {/* Fin de ejecución */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.completedAt', { defaultValue: 'Fin de ejecución' })}
              </span>
              <span className="text-foreground font-medium">{formatIsoDate(job.completed_at)}</span>
            </div>

            {/* Entidad Afectada */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('jobs.entity', { defaultValue: 'Entidad vinculada' })}
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  {entityLabel ? (
                    entityLink ? (
                      <Link
                        to={entityLink}
                        className="font-medium text-blue-500 hover:text-blue-700 hover:underline truncate text-sm"
                      >
                        {entityLabel}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium truncate">{entityLabel}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Sin entidad vinculada</span>
                  )}
                </div>
                {job.entity_id && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopy(job.entity_id!, 'entityId')}
                      >
                        {copiedKey === 'entityId' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('jobs.copyEntityId', { defaultValue: 'Copiar ID de entidad' })}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Creador / Usuario */}
            {job.created_by_id && (
              <div className="py-3.5 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('jobs.createdBy', { defaultValue: 'Creado por (User ID)' })}
                </span>
                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-foreground truncate">
                    {job.created_by_id.slice(0, 8)}...{job.created_by_id.slice(-4)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopy(job.created_by_id!, 'createdById')}
                      >
                        {copiedKey === 'createdById' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('jobs.copyUserId', { defaultValue: 'Copiar ID de usuario' })}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* ID de la tarea */}
            <div className="py-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('jobs.jobId', { defaultValue: 'ID de tarea' })}</span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span>
                  {job.id.slice(0, 8)}...{job.id.slice(-4)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(job.id, 'jobId')}
                    >
                      {copiedKey === 'jobId' ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('jobs.copyJobId', { defaultValue: 'Copiar UUID de tarea' })}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: 3 Pestañas (Resultado, Payload, JSON Crudo) */}
        <Card className="lg:col-span-2 shadow-sm h-full flex flex-col">
          <Tabs defaultValue="output" className="w-full flex-1 flex flex-col">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  {t('jobs.dataTitle', { defaultValue: 'Datos y Ejecución' })}
                </CardTitle>
                <CardDescription>
                  {t(
                    'jobs.dataDescription',
                    { defaultValue: 'Resultados devueltos por el worker, errores o parámetros de entrada.' }
                  )}
                </CardDescription>
              </div>
              <TabsList className="h-8">
                <TabsTrigger value="output" className="text-xs">
                  {t('jobs.tabs.output', { defaultValue: 'Resultado / Salida' })}
                </TabsTrigger>
                <TabsTrigger value="payload" className="text-xs">
                  {t('jobs.tabs.payload', { defaultValue: 'Carga útil (Payload)' })}
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs">
                  {t('jobs.tabs.json', { defaultValue: 'JSON Crudo' })}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col min-h-[320px]">
              {/* Pestaña 1: Resultado / Salida / Error */}
              <TabsContent value="output" className="m-0 flex-1 flex flex-col p-4">
                {job.error ? (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 space-y-2 text-rose-600 dark:text-rose-400">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{t('jobs.errorTitle', { defaultValue: 'Error durante la ejecución' })}</span>
                    </div>
                    <pre className="text-xs font-mono bg-rose-950/20 p-3 rounded border border-rose-500/20 overflow-auto max-h-[300px] whitespace-pre-wrap">
                      {job.error}
                    </pre>
                  </div>
                ) : job.result ? (
                  <div className="relative flex-1 flex flex-col">
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 bg-background/80 backdrop-blur shadow-sm"
                        onClick={() => handleCopy(JSON.stringify(job.result, null, 2), 'resultJson')}
                      >
                        {copiedKey === 'resultJson' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {t('common.copy', { defaultValue: 'Copiar' })}
                      </Button>
                    </div>
                    <div className="p-4 bg-slate-950 dark:bg-zinc-950 text-slate-100 rounded-lg flex-1 font-mono text-xs overflow-auto max-h-[400px]">
                      <pre>{JSON.stringify(job.result, null, 2)}</pre>
                    </div>
                  </div>
                ) : job.status === 'RUNNING' || job.status === 'PENDING' ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {job.status === 'RUNNING'
                          ? t('jobs.runningStatus', { defaultValue: 'Tarea en ejecución activa' })
                          : t('jobs.pendingStatus', { defaultValue: 'Tarea encolada a la espera de un worker disponible' })}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {job.progress_message || t('jobs.autoRefreshNotice', { defaultValue: 'El estado se actualiza automáticamente.' })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {t('jobs.noResultTitle', { defaultValue: 'Tarea finalizada sin retorno adicional' })}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {t('jobs.noResultDesc', { defaultValue: 'La tarea completó sus operaciones sin emitir un payload de resultado específico.' })}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Pestaña 2: Carga Útil (Payload) */}
              <TabsContent value="payload" className="m-0 flex-1 flex flex-col p-4">
                {job.payload && Object.keys(job.payload).length > 0 ? (
                  <div className="relative flex-1 flex flex-col">
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 bg-background/80 backdrop-blur shadow-sm"
                        onClick={() => handleCopy(JSON.stringify(job.payload, null, 2), 'payloadJson')}
                      >
                        {copiedKey === 'payloadJson' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {t('common.copy', { defaultValue: 'Copiar' })}
                      </Button>
                    </div>
                    <div className="p-4 bg-slate-950 dark:bg-zinc-950 text-slate-100 rounded-lg flex-1 font-mono text-xs overflow-auto max-h-[400px]">
                      <pre>{JSON.stringify(job.payload, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                    <Info className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                      {t('jobs.noPayload', { defaultValue: 'Sin payload o parámetros de entrada' })}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Pestaña 3: JSON Crudo */}
              <TabsContent value="json" className="m-0 flex-1 flex flex-col p-4">
                <div className="relative flex-1 flex flex-col">
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 bg-background/80 backdrop-blur shadow-sm"
                      onClick={() => handleCopy(JSON.stringify(job, null, 2), 'rawJobJson')}
                    >
                      {copiedKey === 'rawJobJson' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {t('common.copy', { defaultValue: 'Copiar' })}
                    </Button>
                  </div>
                  <div className="p-4 bg-slate-950 dark:bg-zinc-950 text-slate-100 rounded-lg flex-1 font-mono text-xs overflow-auto max-h-[500px]">
                    <pre>{JSON.stringify(job, null, 2)}</pre>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Diálogo de Confirmación Unificado (Cancel / Retry) */}
      <JobConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isPending={isPendingCancel || isPendingRetry}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
