import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { Setting } from '../model/settings.schema';
import useSettingsTable from '../model/use-settings-table';

export function SettingsTable() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<Setting>[]>(
    () => [
      {
        accessorKey: 'key',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('settings.key')} />,
        cell: ({ row }) => {
          const key = row.getValue('key') as string;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/admin/settings/edit/${encodeURIComponent(key)}`}
                className="truncate font-mono text-xs font-semibold max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
              >
                {key}
              </Link>
            </div>
          );
        },
        meta: {
          label: t('settings.key'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'value',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('settings.value')} />,
        cell: ({ row }) => {
          const val = row.getValue('value');
          if (typeof val === 'boolean') {
            return (
              <Badge variant={val ? 'default' : 'secondary'} className="text-[11px]">
                {val ? 'true' : 'false'}
              </Badge>
            );
          }
          if (typeof val === 'number') {
            return <span className="font-mono text-xs tabular-nums text-foreground">{val}</span>;
          }
          if (typeof val === 'object' && val !== null) {
            const preview = JSON.stringify(val);
            return (
              <code className="text-xs bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded font-mono truncate max-w-[220px] block" title={preview}>
                {preview}
              </code>
            );
          }
          return <span className="text-xs text-foreground truncate max-w-[200px] block">{String(val ?? '')}</span>;
        },
      },
      {
        accessorKey: 'category',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('settings.category')} />,
        cell: ({ row }) => {
          const cat = row.getValue('category') as string;
          return (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
              {cat}
            </Badge>
          );
        },
        meta: {
          label: t('settings.category'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'description',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('settings.description')} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[280px] block" title={row.getValue('description') || ''}>
            {row.getValue('description') || '-'}
          </span>
        ),
      },
    ],
    [t]
  );

  const { table, totalRows, isLoading, isFetching, isMobile, limit } = useSettingsTable(columns);

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
          primaryColumn: 'key',
          stackedColumns: ['value', 'category'],
        }}
      >
        {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
      </DataTable>
    </div>
  );
}
