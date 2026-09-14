import { CalendarIcon, Download, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFloatingBar } from '@/components/data-table/data-table-floating-bar';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { ExportDropdown } from '@/components/export-dropdown';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import usePermissions from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { AuditLogType } from '@/modules/audit/model/audit.schema';
import {
  getActionOptions,
  getAuditActionLabel,
  getAuditModuleLabel,
  getEntityLink,
} from '@/modules/audit/model/audit.types';
import useAuditTable from '@/modules/audit/model/use-audit-table';
import { usersQueries } from '@/modules/users/model/users.query';
import { GetUsersQuery } from '@/modules/users/model/users.schema';
import { useModules, useModulesOptions } from '@/modules/modules/model/modules.query';

interface AuditTableProps {
  moduleSlug?: string;
  entityId?: string;
  exportRef?: React.MutableRefObject<((format: string) => Promise<void> | void) | null>;
}

function useUsersOptions(params: {
  limit: number;
  sortBy?: string;
  sort_by?: string;
  sortOrder?: 'asc' | 'desc';
  sort_order?: 'asc' | 'desc';
  name?: string;
}) {
  const { name } = params;
  const { data, isLoading } = usersQueries.useGetAll({
    page: 1,
    limit: params.limit,
    is_trash: false,
    sort_by: (params.sort_by || params.sortBy || 'name') as GetUsersQuery['sort_by'],
    sort_order: params.sort_order || params.sortOrder || 'asc',
    name: name,
  });

  return {
    data:
      data?.data?.map((u: { id: string; name?: string | null; email?: string | null }) => ({
        id: u.id,
        name: u.name ?? u.email ?? u.id,
      })) ?? [],
    isLoading,
  };
}

export function AuditTable({ moduleSlug, entityId, exportRef }: AuditTableProps) {
  const { t } = useTranslation();
  const { modulesMap } = useModules();

  const columns = React.useMemo<ColumnDef<AuditLogType>[]>(
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
            aria-label={t('audit.table.selectTodo', { defaultValue: 'Seleccionar todo' })}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('audit.table.selectFila', { defaultValue: 'Seleccionar fila' })}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.date')} />,
        cell: ({ row }) => {
          const dateVal = row.getValue('created_at') ?? (row.original as any).createdAt;
          if (!dateVal) return '';
          const formatted = new Date(dateVal as string).toLocaleString('es-ES', {
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
          label: t('audit.date'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
      {
        accessorKey: 'action',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.action')} />,
        cell: ({ row }) => {
          const action = row.getValue('action') as string;
          return (
            <span className="font-medium text-foreground">
              <Link
                to={`/admin/audit/${row.original.id}`}
                className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[200px]"
              >
                {getAuditActionLabel(t, action)}
              </Link>
            </span>
          );
        },
        meta: {
          label: t('audit.action'),
          variant: 'multiSelect',
          options: getActionOptions(t),
        },
      },
      {
        id: 'entity_type',
        accessorKey: 'entity_type',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.module')} />,
        cell: ({ row }) => {
          const slug = (row.getValue('entity_type') ?? (row.original as any).moduleSlug) as string;
          return (
            <span className="text-foreground font-medium">
              {getAuditModuleLabel(t, slug, modulesMap)}
            </span>
          );
        },
        meta: {
          label: t('audit.module'),
          variant: 'asyncMultiSelect',
          useGetList: useModulesOptions,
        },
      },
      {
        id: 'entity_name',
        accessorKey: 'entity_name',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.entity')} />,
        cell: ({ row }) => {
          const slug = row.original.entity_type || row.original.moduleSlug;
          const targetEntityId = row.original.entity_id || row.original.entityId;
          const action = row.original.action;
          const displayName = (row.getValue('entity_name') ?? (row.original as any).displayName) || '-';
          const linkTarget = slug === 'settings' ? (displayName !== '-' ? displayName : targetEntityId) : targetEntityId;
          const link =
            action !== 'LOGIN' && action !== 'LOGOUT' ? getEntityLink(slug, linkTarget) : null;

          return link ? (
            <Link
              to={link}
              className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[200px]"
            >
              {displayName}
            </Link>
          ) : (
            <span className="font-medium text-foreground block truncate max-w-[200px]">
              {displayName}
            </span>
          );
        },
        meta: {
          label: t('audit.entity'),
          variant: 'text',
        },
      },
      {
        id: 'description',
        accessorFn: (row) => row.details ?? (row as any).description ?? '',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('audit.description')} />
        ),
        cell: ({ row }) => {
          const val = row.original.details ?? (row.original as any).description;
          return (
            <span className="text-muted-foreground block truncate max-w-[300px]">
              {val || '-'}
            </span>
          );
        },
        meta: {
          label: t('audit.description'),
          variant: 'text',
        },
      },
      {
        id: 'actor_id',
        accessorKey: 'actor_id',
        enableColumnFilter: true,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.user')} />,
        cell: ({ row }) => {
          const userObj = row.original.user;
          const userName = userObj?.name || userObj?.email || row.original.actor_id || row.original.userId || '-';
          return (
            <span className="text-foreground font-medium block truncate max-w-[150px]">
              {userName}
            </span>
          );
        },
        meta: {
          label: t('audit.user'),
          variant: 'asyncMultiSelect',
          useGetList: useUsersOptions,
        },
      },
      {
        id: 'ip_address',
        accessorKey: 'ip_address',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('audit.ipAddress')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {(row.getValue('ip_address') ?? (row.original as any).ipAddress) || '-'}
          </span>
        ),
        meta: {
          label: t('audit.ipAddress'),
          variant: 'text',
        },
      },
      {
        id: 'actions',
        maxSize: 50,
        enableHiding: false,
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to={`/admin/audit/${row.original.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">{t('audit.detail')}</span>
            </Link>
          </Button>
        ),
      },
    ],
    [t, modulesMap]
  );

  const { can } = usePermissions();
  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    handleExport,
    isPendingActions,
  } = useAuditTable(columns, {
    moduleSlug,
    entityId,
  });

  if (exportRef) {
    exportRef.current = (format: string) =>
      handleExport(
        table.getSelectedRowModel().rows.length > 0
          ? table.getSelectedRowModel().rows
          : undefined,
        format
      );
  }

  const floatingActions = React.useMemo(() => {
    const list = [];
    if (can('audit', 'EXPORT')) {
      list.push({
        label: t('export.button', { defaultValue: 'Exportar' }),
        render: (selectedRows: any) => (
          <ExportDropdown
            entityName="audit"
            onExport={(format) => handleExport(selectedRows, format)}
            isPending={isPendingActions}
            size="sm"
            variant="ghost"
            align="start"
          />
        ),
      });
    }
    return list;
  }, [can, t, isPendingActions, handleExport]);

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
          primaryColumn: 'created_at',
          stackedColumns: ['action', 'description'],
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
