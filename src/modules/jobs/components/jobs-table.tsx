import * as React from 'react';
import { Ban, CalendarIcon, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import usePermissions from '@/hooks/use-permissions';
import { useModules, useModulesOptions } from '@/modules/modules/model/modules.query';
import { getAuditModuleLabel, getEntityLink, normalizeModuleSlug } from '@/modules/audit/model/audit.types';

import { JobDefinition, JobType } from '../model/jobs.schema';
import {
  formatJobDuration,
  getJobDefinitionTitle,
  getJobIcon,
  getJobStatusLabel,
  getJobStatusOptions,
} from '../model/jobs.types';
import { jobsQueries } from '../model/jobs.query';
import useJobsTable from '../model/use-jobs-table';
import { JobConfirmDialog } from './job-confirm-dialog';
import { JobStatusBadge } from './job-status-badge';

interface JobsTableProps {
  entityType?: string;
  entityId?: string;
}

export function JobsTable({ entityType, entityId }: JobsTableProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { modulesMap } = useModules();
  const { can } = usePermissions();

  const canUpdate = can('jobs', 'UPDATE');
  const canSettings = can('jobs', 'SETTINGS');

  // Confirmation dialog state for cancel / retry
  const [confirmState, setConfirmState] = React.useState<{
    open: boolean;
    jobId: string;
    action: 'cancel' | 'retry';
    title: string;
    description: string;
    confirmText: string;
    variant: 'default' | 'destructive';
  }>({
    open: false,
    jobId: '',
    action: 'cancel',
    title: '',
    description: '',
    confirmText: '',
    variant: 'default',
  });

  const { mutateAsync: cancelJob, isPending: isPendingCancel } = jobsQueries.useCancel();
  const { mutateAsync: retryJob, isPending: isPendingRetry } = jobsQueries.useRetry();

  const handleActionConfirm = async () => {
    const { action, jobId } = confirmState;
    if (!jobId) return;

    try {
      if (action === 'cancel') {
        const res = await cancelJob(jobId);
        toast.success(t('jobs.toast.cancelSuccess', { defaultValue: res.message || 'Tarea cancelada correctamente' }));
      } else {
        const res = await retryJob(jobId);
        toast.success(t('jobs.toast.retrySuccess', { defaultValue: res.message || 'Tarea programada para reintento' }));
      }
      setConfirmState((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;
      toast.error(
        (action === 'cancel'
          ? t('jobs.toast.cancelError', { defaultValue: msg || 'Error al cancelar la tarea' })
          : t('jobs.toast.retryError', { defaultValue: msg || 'Error al reintentar la tarea' }))
      );
    }
  };

  const { data: definitions } = jobsQueries.useDefinitions();
  const definitionsMap = React.useMemo(() => {
    const map: Record<string, JobDefinition> = {};
    definitions?.forEach((def) => {
      map[def.name] = def;
    });
    return map;
  }, [definitions]);

  const columns = React.useMemo<ColumnDef<JobType>[]>(
    () => [
      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.createdAt', { defaultValue: 'Fecha' })} />,
        cell: ({ row }) => {
          const dateVal = row.getValue('created_at') as string;
          if (!dateVal) return '-';
          const formatted = new Date(dateVal).toLocaleString(i18n.language, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return <span className="text-muted-foreground tabular-nums text-sm">{formatted}</span>;
        },
        meta: {
          label: t('jobs.createdAt', { defaultValue: 'Fecha' }),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
      {
        id: 'name',
        accessorKey: 'name',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.name', { defaultValue: 'Nombre' })} />,
        cell: ({ row }) => {
          const name = row.getValue('name') as string;
          const def = definitionsMap[name];
          const Icon = def ? getJobIcon(def.icon) : null;
          const title = getJobDefinitionTitle(t, name, def?.title);
          return (
            <Link
              to={`/admin/jobs/${row.original.id}`}
              className="font-medium text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1.5 truncate max-w-[260px]"
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              <span className="truncate">{title}</span>
            </Link>
          );
        },
        meta: {
          label: t('jobs.name', { defaultValue: 'Nombre' }),
          variant: 'text',
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.status.label', { defaultValue: 'Estado' })} />,
        cell: ({ row }) => {
          const job = row.original;
          const isPendingFuture =
            job.status === 'PENDING' &&
            job.scheduled_at &&
            new Date(job.scheduled_at).getTime() > Date.now();

          return (
            <div className="flex flex-col items-start gap-1">
              <JobStatusBadge status={job.status} />
              {isPendingFuture && (
                <span
                  className="text-[11px] text-muted-foreground flex items-center gap-1 tabular-nums whitespace-nowrap"
                  title={`${t('jobs.scheduledAt', { defaultValue: 'Programado para' })}: ${new Date(job.scheduled_at!).toLocaleString(i18n.language)}`}
                >
                  <CalendarIcon className="h-3 w-3 shrink-0 inline text-muted-foreground/80" />
                  {new Date(job.scheduled_at!).toLocaleString(i18n.language, {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: t('jobs.status.label', { defaultValue: 'Estado' }),
          variant: 'multiSelect',
          options: getJobStatusOptions(t),
        },
      },
      {
        id: 'progress',
        accessorKey: 'progress',
        enableColumnFilter: false,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.progress', { defaultValue: 'Progreso' })} />,
        cell: ({ row }) => {
          const progress = row.original.progress ?? 0;
          const msg = row.original.progress_message;
          return (
            <div className="flex flex-col gap-1 w-[120px]">
              <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    row.original.status === 'FAILED'
                      ? 'bg-rose-500'
                      : row.original.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              {msg && (
                <span className="text-[11px] text-muted-foreground truncate" title={msg}>
                  {msg}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: t('jobs.progress', { defaultValue: 'Progreso' }),
          variant: 'text',
        },
      },
      {
        id: 'attempts',
        accessorKey: 'attempts',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.attempts', { defaultValue: 'Intentos' })} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {row.original.attempts} / {row.original.max_retries}
          </span>
        ),
      },
      {
        id: 'entity_type',
        accessorKey: 'entity_type',
        enableColumnFilter: true,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.entity', { defaultValue: 'Entidad' })} />,
        cell: ({ row }) => {
          const type = row.original.entity_type;
          const targetId = row.original.entity_id;
          if (!type) return <span className="text-muted-foreground italic text-xs">-</span>;

          const slug = normalizeModuleSlug(type);
          const link = getEntityLink(slug, targetId);
          const label = getAuditModuleLabel(t, slug, modulesMap);

          return link ? (
            <Link
              to={link}
              className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[150px] text-xs"
            >
              {label}
            </Link>
          ) : (
            <span className="text-muted-foreground block truncate max-w-[150px] text-xs">
              {label}
            </span>
          );
        },
        meta: {
          label: t('jobs.entity', { defaultValue: 'Entidad' }),
          variant: 'asyncMultiSelect',
          useGetList: useModulesOptions,
        },
      },
      {
        id: 'duration',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('jobs.duration', { defaultValue: 'Duración' })} />,
        cell: ({ row }) => {
          const duration = formatJobDuration(row.original.started_at, row.original.completed_at);
          return <span className="text-muted-foreground font-mono text-xs tabular-nums">{duration}</span>;
        },
      },
      {
        id: 'actions',
        maxSize: 100,
        enableHiding: false,
        header: '',
        cell: ({ row }) => {
          const job = row.original;
          const isCancellable = job.status === 'PENDING' || job.status === 'RUNNING';
          const isRetryable = job.status === 'FAILED' || job.status === 'CANCELLED';

          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdate && isCancellable && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          jobId: job.id,
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
                    >
                      <Ban className="h-4 w-4" />
                      <span className="sr-only">{t('jobs.actions.cancel', { defaultValue: 'Cancelar' })}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('jobs.actions.cancel', { defaultValue: 'Cancelar tarea' })}</TooltipContent>
                </Tooltip>
              )}

              {canSettings && isRetryable && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          jobId: job.id,
                          action: 'retry',
                          title: t('jobs.dialog.retryTitle', { defaultValue: '¿Reintentar tarea?' }),
                          description: t(
                            'jobs.dialog.retryDescription',
                            { defaultValue: 'Se reprogramará la tarea nuevamente con estado PENDIENTE para su ejecución inmediata por los workers.' }
                          ),
                          confirmText: t('jobs.dialog.confirmRetry', { defaultValue: 'Reintentar' }),
                          variant: 'default',
                        })
                      }
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="sr-only">{t('jobs.actions.retry', { defaultValue: 'Reintentar' })}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('jobs.actions.retry', { defaultValue: 'Reintentar tarea' })}</TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [t, i18n.language, modulesMap, canUpdate, canSettings, definitionsMap]
  );

  const { table, totalRows, isLoading, isMobile, limit } = useJobsTable(columns, {
    entityType,
    entityId,
  });

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={limit}
        filterCount={2}
        withPagination={true}
      />
    );
  }

  return (
    <>
      <div className="relative">
        <DataTable
          table={table}
          totalCount={totalRows}
          onRowDoubleClick={(row) => navigate(`/admin/jobs/${row.original.id}`)}
          mobileConfig={{
            primaryColumn: 'name',
            stackedColumns: ['status', 'progress', 'created_at'],
          }}
        >
          {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
        </DataTable>
      </div>

      <JobConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        isPending={isPendingCancel || isPendingRetry}
        onConfirm={handleActionConfirm}
      />
    </>
  );
}
