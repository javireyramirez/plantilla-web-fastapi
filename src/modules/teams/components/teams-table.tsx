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
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TeamResponse } from '@/modules/teams/model/teams.schema';
import useteams from '@/modules/teams/model/use-teams-table';

export function TeamsTable() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<TeamResponse>[]>(
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
            aria-label={t('teams.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('teams.table.selectFila')}
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
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('teams.name')} />,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => navigate(`/admin/teams/edit/${row.original.id}`)}
              >
                {row.getValue('name')}
              </button>
            </div>
          );
        },
        meta: {
          label: t('teams.name'),
          variant: 'text',
        },
      },

      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('teams.table.fecha')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate((row.getValue('created_at') ?? (row.original as any).createdAt) as string)}
          </span>
        ),
        meta: {
          label: t('teams.table.creacion'),
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
    handleExport,
    isPendingActions,
  } = useteams(columns);

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
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('teams.export'),
                icon: <Download className="h-4 w-4" />,
                disabled: isPendingActions,
                onClick: (rows) => handleExport(rows),
              },
              {
                label: t('teams.delete'),
                icon: <Trash2 className="h-4 w-4" />,
                disabled: isPendingActions,
                onClick: (rows) => handleDelete(rows),
                className:
                  'border-destructive text-destructive hover:bg-destructive hover:text-white',
              },
            ]}
          />
        }
      >
        {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
      </DataTable>
    </div>
  );
}
