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
import usePermissions from '@/hooks/use-permissions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Company } from '@/modules/companies/model/companies.schema';
import { SECTOR_OPTIONS } from '@/modules/companies/model/companies.types';
import useCompanies from '@/modules/companies/model/use-companies-table';

export function CompaniesTable() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();

  const columns = React.useMemo<ColumnDef<Company>[]>(
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
            aria-label={t('companies.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('companies.table.selectFila')}
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('companies.name')} />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => navigate(`/companies/edit/${row.original.id}`)}
              >
                {row.getValue('name')}
              </button>
            </div>
          );
        },
        meta: {
          label: t('companies.name'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'nif',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('companies.table.cif')} />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 min-w-0">
                {row.getValue('nif')}
            </div>
          );
        },
        meta: {
          label: t('companies.table.cif'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'sector',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('companies.sector')} />
        ),
        cell: ({ row }) => {
          const sectorValue = row.getValue('sector');
          const sectorOpt = SECTOR_OPTIONS.find((opt) => opt.value === sectorValue);

          return (
            <div className="flex items-center gap-2 min-w-0">
              {sectorOpt ? t(`companies.sectors.${sectorOpt.value}`) : t('companies.sectors.none')}
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const ct = row.getValue(id) as string;
          return (value as string[]).some(
            (v) => SECTOR_OPTIONS.find((opt) => opt.value === v) ?? false
          );
        },
        meta: {
          label: t('companies.sector'),
          variant: 'multiSelect',
          options: SECTOR_OPTIONS.map((opt) => ({
            ...opt,
            label: t(`companies.sectors.${opt.value}`),
          })),
        },
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('companies.table.creacion')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate((row.getValue('created_at') ?? (row.original as any).createdAt) as string)}
          </span>
        ),
        meta: {
          label: t('companies.table.creacion'),
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
  } = useCompanies(columns);

  const floatingActions = React.useMemo(() => {
    const list = [];
    if (can('companies', 'EXPORT')) {
      list.push({
        label: t('companies.export'),
        icon: <Download className="h-4 w-4" />,
        disabled: isPendingActions,
        onClick: (rows: any) => handleExport(rows),
      });
    }
    if (can('companies', 'DELETE')) {
      list.push({
        label: t('companies.delete'),
        icon: <Trash2 className="h-4 w-4" />,
        disabled: isPendingActions,
        onClick: (rows: any) => handleDelete(rows),
        className: 'border-destructive text-destructive hover:bg-destructive hover:text-white',
      });
    }
    return list;
  }, [can, t, isPendingActions, handleExport, handleDelete]);

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
          stackedColumns: ['sector', 'created_at'],
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
