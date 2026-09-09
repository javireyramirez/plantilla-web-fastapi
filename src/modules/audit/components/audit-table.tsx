import { CalendarIcon, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AuditLogType } from '@/modules/audit/model/audit.schema';
import {
  getActionOptions,
  getEntityLink,
  getModuleOptions,
} from '@/modules/audit/model/audit.types';
import useAuditTable from '@/modules/audit/model/use-audit-table';
import { usersQueries } from '@/modules/users/model/users.query';
import { GetUsersQuery } from '@/modules/users/model/users.schema';

interface AuditTableProps {
  moduleSlug?: string;
  entityId?: string;
}

function useUsersOptions(params: {
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  name?: string;
}) {
  const { name, ...rest } = params;
  const { data, isLoading } = usersQueries.useGetAll({
    page: 1,
    limit: params.limit,
    isTrash: false,
    sortBy: params.sortBy as GetUsersQuery['sortBy'],
    sortOrder: params.sortOrder,
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

export function AuditTable({ moduleSlug, entityId }: AuditTableProps) {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<AuditLogType>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.date')} />,
        cell: ({ row }) => {
          const dateVal = row.getValue('createdAt');
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
                to={`/audit/${row.original.id}`}
                className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[200px]"
              >
                {' '}
                {t(`audit.actions.${action}`) || action}
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
        accessorKey: 'moduleSlug',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.module')} />,
        cell: ({ row }) => {
          const slug = row.getValue('moduleSlug') as string;
          if (!slug) return '-';
          const translationKey = `modules.names.${slug}`;
          const translated = t(translationKey);
          return (
            <span className="text-foreground font-medium capitalize">
              {translated !== translationKey ? translated : slug}
            </span>
          );
        },
        meta: {
          label: t('audit.module'),
          variant: 'multiSelect',
          options: getModuleOptions(t),
        },
      },
      {
        accessorKey: 'displayName',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.entity')} />,
        cell: ({ row }) => {
          const slug = row.original.moduleSlug;
          const entityId = row.original.entityId;
          const action = row.original.action;
          const displayName = (row.getValue('displayName') as string) || '-';
          const link =
            action !== 'LOGIN' && action !== 'LOGOUT' ? getEntityLink(slug, entityId) : null;

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
      },
      {
        accessorKey: 'description',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('audit.description')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground block truncate max-w-[300px]">
            {row.getValue('description') || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'userId',
        enableColumnFilter: true,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('audit.user')} />,
        cell: ({ row }) => {
          const userObj = row.original.user;
          const userName = userObj?.name || userObj?.email || row.original.userId || '-';
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
        accessorKey: 'ipAddress',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('audit.ipAddress')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.getValue('ipAddress') || '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        maxSize: 50,
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to={`/audit/${row.original.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">{t('audit.detail')}</span>
            </Link>
          </Button>
        ),
      },
    ],
    [t]
  );

  const { table, totalRows, isLoading, isFetching, isMobile, limit } = useAuditTable(columns, {
    moduleSlug,
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
          primaryColumn: 'createdAt',
          stackedColumns: ['action', 'description'],
        }}
      >
        {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
      </DataTable>
    </div>
  );
}
