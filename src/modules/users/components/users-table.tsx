import { Ban, CalendarIcon, Download, LoaderCircle, Send, Trash2, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFloatingBar } from '@/components/data-table/data-table-floating-bar';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useSession } from '@/config/auth-client';
import { useImpersonateUser } from '@/hooks/use-auth';
import usePermissions from '@/hooks/use-permissions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import useUsers from '@/modules/users//model/use-users-table';
import { UsersResponse } from '@/modules/users/model/users.schema';

interface UsersTableProps {
  exportRef?: React.MutableRefObject<((format: string) => Promise<void> | void) | null>;
}

export function UsersTable({ exportRef }: UsersTableProps = {}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can, isSuperAdmin } = usePermissions();
  const { data: session } = useSession();
  const impersonateMutation = useImpersonateUser();
  const [userToImpersonate, setUserToImpersonate] = React.useState<UsersResponse | null>(null);

  const columns = React.useMemo<ColumnDef<UsersResponse>[]>(
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
            aria-label={t('users.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('users.table.selectFila')}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('users.name')} />,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => navigate(`/admin/users/edit/${row.original.id}`)}
              >
                {row.getValue('name')}
              </button>
            </div>
          );
        },
        meta: {
          label: t('users.name'),
          variant: 'text',
        },
      },

      {
        accessorKey: 'email',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('users.email')} />,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => navigate(`/admin/users/edit/${row.original.id}`)}
              >
                {row.getValue('email')}
              </button>
            </div>
          );
        },
        meta: {
          label: t('users.email'),
          variant: 'text',
        },
      },

      {
        id: 'is_active',
        accessorKey: 'is_active',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.isActive')} />
        ),
        cell: ({ row }) => {
          const isActive = (row.getValue('is_active') ?? (row.original as any).isActive) as boolean;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? t('users.table.active') : t('users.table.inactive')}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('users.isActive'),
          variant: 'boolean',
          options: [
            { label: t('users.table.active'), value: 'true' },
            { label: t('users.table.inactive'), value: 'false' },
          ],
        },
      },

      {
        id: 'is_system',
        accessorKey: 'is_system',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.isSystem')} />
        ),
        cell: ({ row }) => {
          const isSystem = (row.getValue('is_system') ?? (row.original as any).isSystem) as boolean;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={isSystem ? 'default' : 'secondary'}>
                {isSystem ? t('users.table.isSystem') : t('users.table.isNotSystem')}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('users.isSystem'),
          variant: 'boolean',
          options: [
            { label: t('users.table.isSystem'), value: 'true' },
            { label: t('users.table.isNotSystem'), value: 'false' },
          ],
        },
      },

      {
        id: 'email_verified',
        accessorKey: 'email_verified',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.emailVerified')} />
        ),
        cell: ({ row }) => {
          const emailVerified = (row.getValue('email_verified') ?? (row.original as any).emailVerified) as boolean;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={emailVerified ? 'default' : 'secondary'}>
                {emailVerified ? t('users.table.emailVerified') : t('users.table.emailNoVerified')}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('users.emailVerified'),
          variant: 'boolean',
          options: [
            { label: t('users.table.emailVerified'), value: 'true' },
            { label: t('users.table.emailNoVerified'), value: 'false' },
          ],
        },
      },

      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.table.creacion')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate((row.getValue('created_at') ?? (row.original as any).createdAt) as string)}
          </span>
        ),
        meta: {
          label: t('users.table.creacion'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const user = row.original;
          const isCurrentUser = user.id === session?.user?.id;
          if (!isSuperAdmin || isCurrentUser) return null;
          return (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/50 gap-1.5 font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserToImpersonate(user);
                }}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('impersonate.actionButton', { defaultValue: 'Impersonar' })}</span>
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, navigate, isSuperAdmin, session?.user?.id]
  );

  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    handleDelete,
    handleSuspend,
    handleUnsuspend,
    handleResendInvitation,
    handleExport,
    isPendingExport,
    isPendingActions,
  } = useUsers(columns);

  if (exportRef) {
    exportRef.current = (format: string, asyncJob?: boolean) => handleExport(undefined, format, asyncJob);
  }

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasActive = selectedRows.some((r) => r.original.is_active ?? (r.original as any).isActive);
  const hasInactive = selectedRows.some((r) => !(r.original.is_active ?? (r.original as any).isActive));

  const floatingActions = React.useMemo(() => {
    const list = [];
    if (can('users', 'EXPORT')) {
      list.push({
        label: t('export.button', { defaultValue: 'Exportar' }),
        render: (selectedRows: any) => (
          <ExportDropdown
            entityName="users"
            onExport={(format, asyncJob) => handleExport(selectedRows, format, asyncJob)}
            isPending={isPendingExport}
            size="sm"
            variant="ghost"
            align="start"
          />
        ),
      });
    }
    if (can('users', 'UPDATE')) {
      list.push({
        label: t('users.resendInvitation'),
        icon: <Send className="h-4 w-4" />,
        disabled: isPendingActions,
        onClick: (rows: any) => handleResendInvitation(rows),
      });
      if (hasActive) {
        list.push({
          label: t('users.suspend'),
          icon: <Ban className="h-4 w-4" />,
          disabled: isPendingActions,
          onClick: (rows: any) => handleSuspend(rows),
          className: 'border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white',
        });
      }
      if (hasInactive) {
        list.push({
          label: t('users.unsuspend'),
          icon: <UserCheck className="h-4 w-4" />,
          disabled: isPendingActions,
          onClick: (rows: any) => handleUnsuspend(rows),
          className: 'border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white',
        });
      }
    }
    if (can('users', 'DELETE')) {
      list.push({
        label: t('users.delete'),
        icon: <Trash2 className="h-4 w-4" />,
        disabled: isPendingActions,
        onClick: (rows: any) => handleDelete(rows),
        className: 'border-destructive text-destructive hover:bg-destructive hover:text-white',
      });
    }
    return list;
  }, [
    can,
    t,
    isPendingActions,
    hasActive,
    hasInactive,
    handleExport,
    handleResendInvitation,
    handleSuspend,
    handleUnsuspend,
    handleDelete,
  ]);

  // Skeleton
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={limit}
        filterCount={4}
        withPagination={true}
      />
    );
  }

  // Tabla
  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
      )}
    >
      <DataTable
        table={table}
        totalCount={totalRows}
        onRowDoubleClick={(row) => navigate(`/admin/users/edit/${row.original.id}`)}
        mobileConfig={{
          primaryColumn: 'name',
          stackedColumns: ['created_at'],
        }}
        actionBar={
          floatingActions.length > 0 ? (
            <DataTableFloatingBar table={table} actions={floatingActions} />
          ) : undefined
        }
      >
        {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
      </DataTable>

      {/* DIÁLOGO: Confirmar Impersonación */}
      <AlertDialog
        open={Boolean(userToImpersonate)}
        onOpenChange={(open) => !open && setUserToImpersonate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('impersonate.dialogTitle', { defaultValue: '¿Iniciar sesión como este usuario?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('impersonate.dialogDesc', {
                defaultValue:
                  'Accederás a la plataforma suplantando la identidad de {{name}}. Podrás salir de la suplantación en cualquier momento desde el banner superior.',
                name: userToImpersonate?.name || userToImpersonate?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonateMutation.isPending}>
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={impersonateMutation.isPending}
              onClick={() => {
                if (userToImpersonate) {
                  impersonateMutation.mutate(userToImpersonate.id);
                }
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
            >
              {impersonateMutation.isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t('impersonate.starting', { defaultValue: 'Iniciando...' })}
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  {t('impersonate.confirmBtn', { defaultValue: 'Iniciar suplantación' })}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
