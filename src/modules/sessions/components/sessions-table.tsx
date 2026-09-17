import * as React from 'react';
import { Ban, CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFloatingBar } from '@/components/data-table/data-table-floating-bar';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { ExportDropdown } from '@/components/export-dropdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import usePermissions from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

import { SessionAdminType } from '../model/sessions.schema';
import { getSessionStatusOptions } from '../model/sessions.types';
import useSessionsTable from '../model/use-sessions-table';
import { SessionDeviceInfo } from './session-device-info';
import { SessionStatusBadge } from './session-status-badge';

interface SessionsTableProps {
  userId?: string;
  exportRef?: React.MutableRefObject<((format: string) => Promise<void> | void) | null>;
}

export function SessionsTable({ userId, exportRef }: SessionsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canDelete = can('sessions', 'DELETE');
  const canExport = can('sessions', 'EXPORT');

  // Bulk revoke dialog state
  const [bulkRevokeOpen, setBulkRevokeOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<SessionAdminType>[]>(
    () => [
      {
        id: 'select',
        maxSize: 40,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('table.selectAll', { defaultValue: 'Seleccionar todo' })}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.original.is_valid}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('table.selectRow', { defaultValue: 'Seleccionar fila' })}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'user',
        accessorKey: 'user_name',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('sessions.user', { defaultValue: 'Usuario' })} />
        ),
        cell: ({ row }) => {
          const session = row.original;
          return (
            <div className="flex flex-col min-w-[160px] max-w-[220px]">
              <Link
                to={`/admin/users/edit/${session.user_id}`}
                className="font-medium text-blue-500 hover:text-blue-700 hover:underline truncate text-sm"
              >
                {session.user_name}
              </Link>
              <span className="text-xs text-muted-foreground truncate font-mono">
                {session.user_email}
              </span>
            </div>
          );
        },
        meta: {
          label: t('sessions.user', { defaultValue: 'Usuario' }),
          variant: 'text',
        },
      },
      {
        id: 'status',
        accessorKey: 'is_valid',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('sessions.status.label', { defaultValue: 'Estado' })} />
        ),
        cell: ({ row }) => <SessionStatusBadge session={row.original} />,
        meta: {
          label: t('sessions.status.label', { defaultValue: 'Estado' }),
          variant: 'multiSelect',
          options: getSessionStatusOptions(t),
        },
      },
      {
        id: 'device',
        accessorKey: 'user_agent',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('sessions.device', { defaultValue: 'Dispositivo' })} />
        ),
        cell: ({ row }) => (
          <Link
            to={`/admin/sessions/${row.original.id}`}
            className="group block cursor-pointer text-left focus:outline-none hover:underline"
          >
            <SessionDeviceInfo userAgent={row.original.user_agent} ipAddress={row.original.ip_address} />
          </Link>
        ),
      },
      {
        id: 'ip_address',
        accessorKey: 'ip_address',
        enableColumnFilter: false,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('sessions.ipAddress', { defaultValue: 'Dirección IP' })} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.ip_address || '-'}
          </span>
        ),
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('sessions.createdAt', { defaultValue: 'Inicio de sesión' })} />
        ),
        cell: ({ row }) => {
          const val = row.original.created_at;
          if (!val) return '-';
          const formatted = new Date(val).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          return <span className="text-muted-foreground tabular-nums text-xs">{formatted}</span>;
        },
        meta: {
          label: t('sessions.createdAt', { defaultValue: 'Inicio de sesión' }),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
      {
        id: 'expires_at',
        accessorKey: 'expires_at',
        enableColumnFilter: false,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('sessions.expiresAt', { defaultValue: 'Expiración' })} />
        ),
        cell: ({ row }) => {
          const val = row.original.expires_at;
          if (!val) return '-';
          const formatted = new Date(val).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          return <span className="text-muted-foreground tabular-nums text-xs">{formatted}</span>;
        },
      },
    ],
    [t]
  );

  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    handleBulkRevoke,
    handleExport,
    isPendingBulkRevoke,
    isPendingActions,
  } = useSessionsTable(columns, { userId });

  if (exportRef) {
    exportRef.current = (format: string) =>
      handleExport(
        table.getSelectedRowModel().rows.length > 0
          ? table.getSelectedRowModel().rows
          : undefined,
        format
      );
  }

  const selectedRows = table.getSelectedRowModel().rows;
  const activeSelectedRows = selectedRows.filter((r) => r.original.is_valid);
  const selectedHasCurrent = activeSelectedRows.some((r) => r.original.is_current);

  const floatingActions = React.useMemo(() => {
    const list = [];

    if (canDelete) {
      list.push({
        label: t('sessions.actions.bulkRevoke', { defaultValue: 'Revocar seleccionadas' }),
        render: () => (
          <Button
            variant="destructive"
            size="sm"
            disabled={activeSelectedRows.length === 0 || isPendingBulkRevoke}
            onClick={() => setBulkRevokeOpen(true)}
            className="gap-1.5 h-8 text-xs font-medium"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{t('sessions.actions.bulkRevoke', { defaultValue: 'Revocar seleccionadas' })}</span>
          </Button>
        ),
      });
    }

    if (canExport) {
      list.push({
        label: t('export.button', { defaultValue: 'Exportar' }),
        render: (rows: any) => (
          <ExportDropdown
            entityName="sessions"
            onExport={(format) => handleExport(rows, format)}
            isPending={isPendingActions}
            size="sm"
            variant="ghost"
            align="start"
          />
        ),
      });
    }

    return list;
  }, [canDelete, canExport, activeSelectedRows.length, isPendingBulkRevoke, isPendingActions, t, handleExport]);

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
      <div
        className={cn(
          'transition-opacity duration-200',
          isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
        )}
      >
        <DataTable
          table={table}
          totalCount={totalRows}
          onRowDoubleClick={(row) => {
            navigate(`/admin/sessions/${row.original.id}`);
          }}
          mobileConfig={{
            primaryColumn: 'user',
            stackedColumns: ['status', 'device', 'created_at'],
          }}
          actionBar={
            floatingActions.length > 0 ? (
              <DataTableFloatingBar table={table} actions={floatingActions} />
            ) : undefined
          }
        >
          {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
        </DataTable>
      </div>

      {/* Diálogo de Confirmación Masiva */}
      <AlertDialog open={bulkRevokeOpen} onOpenChange={setBulkRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedHasCurrent
                ? t('sessions.dialog.bulkWithCurrentTitle', {
                    defaultValue: '¿Revocar sesiones seleccionadas (incluye tu sesión actual)?',
                  })
                : t('sessions.dialog.bulkTitle', {
                    defaultValue: '¿Revocar sesiones seleccionadas?',
                  })}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('sessions.dialog.bulkDesc', {
                  count: activeSelectedRows.length,
                  defaultValue: `Se revocarán ${activeSelectedRows.length} sesiones activas. Los dispositivos afectados requerirán una nueva autenticación.`,
                })}
              </p>
              {selectedHasCurrent && (
                <p className="font-semibold text-rose-500">
                  {t('sessions.dialog.bulkCurrentWarning', {
                    defaultValue:
                      'Atención: Tu sesión actual está seleccionada. Al proceder, tu acceso se cerrará de inmediato.',
                  })}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPendingBulkRevoke}>
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPendingBulkRevoke}
              onClick={async (e) => {
                e.preventDefault();
                await handleBulkRevoke(activeSelectedRows);
                setBulkRevokeOpen(false);
              }}
            >
              {t('sessions.dialog.confirmBulkRevoke', {
                defaultValue: 'Revocar seleccionadas',
              })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
