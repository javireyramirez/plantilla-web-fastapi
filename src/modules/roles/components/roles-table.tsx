import { CalendarIcon, Download, Trash2 } from 'lucide-react';
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
import usePermissions from '@/hooks/use-permissions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import useRoles from '@/modules/roles//model/use-roles-table';
import { RoleResponse } from '@/modules/roles/model/roles.schema';

export function RolesTable() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();

  const columns = React.useMemo<ColumnDef<RoleResponse>[]>(
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
            aria-label={t('roles.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('roles.table.selectFila')}
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
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('roles.name')} />,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => navigate(`/admin/roles/edit/${row.original.id}`)}
              >
                {row.getValue('name')}
              </button>
            </div>
          );
        },
        meta: {
          label: t('roles.name'),
          variant: 'text',
        },
      },
      {
        id: 'is_system',
        accessorKey: 'is_system',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('roles.table.type', { defaultValue: 'Tipo' })} />
        ),
        cell: ({ row }) => {
          const isSystem = (row.getValue('is_system') ?? (row.original as any).isSystem) as boolean;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={isSystem ? 'default' : 'secondary'}>
                {isSystem
                  ? t('users.table.isSystem', { defaultValue: 'Sistema' })
                  : t('users.table.isNotSystem', { defaultValue: 'Personalizado' })}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('roles.table.type', { defaultValue: 'Tipo' }),
          variant: 'boolean',
          options: [
            { label: t('users.table.isSystem', { defaultValue: 'Sistema' }), value: 'true' },
            { label: t('users.table.isNotSystem', { defaultValue: 'Personalizado' }), value: 'false' },
          ],
        },
      },

      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('roles.table.creacion')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate((row.getValue('created_at') ?? (row.original as any).createdAt) as string)}
          </span>
        ),
        meta: {
          label: t('roles.table.creacion'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
    ],
    [t, navigate]
  );

  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    handleDelete,
    isPendingActions,
  } = useRoles(columns);

  const floatingActions = React.useMemo(() => {
    const list = [];
    if (can('roles', 'DELETE')) {
      list.push({
        label: t('roles.delete'),
        icon: <Trash2 className="h-4 w-4" />,
        disabled: isPendingActions,
        onClick: (rows: any) => handleDelete(rows),
        className:
          'border-destructive text-destructive hover:bg-destructive hover:text-white',
      });
    }
    return list;
  }, [can, t, isPendingActions, handleDelete]);

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
    </div>
  );
}
