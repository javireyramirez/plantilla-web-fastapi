import { CalendarIcon, Download, ExternalLink, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Document,
  DocumentsTableComponentProps,
} from '@/features/storage/model/storage-table-types';
import {
  CONTENT_TYPE_OPTIONS,
  getContentTypeIcon,
  getContentTypeLabel,
} from '@/features/storage/model/storage-table-utils';
import { useStorageTable } from '@/features/storage/model/use-storage-table';
import { formatBytes, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export function DocumentsTable({
  entityType,
  entityId,
  isTrash = false,
}: DocumentsTableComponentProps) {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<Document>[]>(
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
            aria-label={t('storage.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('storage.table.selectRow')}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'fileName',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('storage.table.fileName')} />
        ),
        cell: ({ row }) => {
          const contentType = row.getValue('contentType') as string;
          const Icon = getContentTypeIcon(contentType);
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => handleDownloadUrl(row.original.id)}
              >
                {row.getValue('fileName')}
              </button>
            </div>
          );
        },
        meta: {
          label: t('storage.table.fileName'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'contentType',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('storage.table.type')} />
        ),
        cell: ({ row }) => {
          const ct = row.getValue('contentType') as string;
          return (
            <Badge variant="secondary" className="font-mono text-xs">
              {getContentTypeLabel(ct)}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          const ct = row.getValue(id) as string;
          return (value as string[]).some(
            (v) =>
              CONTENT_TYPE_OPTIONS.find((opt) => opt.value === v)?.mimeTypes.includes(ct) ?? false
          );
        },
        meta: {
          label: t('storage.table.type'),
          variant: 'multiSelect',
          options: CONTENT_TYPE_OPTIONS.map((opt) => ({
            ...opt,
            label: t(`storage.types.${opt.value}`),
          })),
        },
      },
      {
        accessorKey: 'size',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('storage.table.size')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatBytes(row.getValue('size'))}
          </span>
        ),
        filterFn: 'inNumberRange',

        meta: {
          label: t('storage.table.size'),
          variant: 'range',
          range: [0, 25],
          unit: 'MB',
        },
      },
      {
        accessorKey: 'createdAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('storage.table.date')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('createdAt'))}
          </span>
        ),
        meta: {
          label: t('storage.table.creation'),
          variant: 'dateRange',
          icon: CalendarIcon,
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
    handleDownloadUrl,
    handleDelete,
    handleBulkDownload,
    isPendingActions,
  } = useStorageTable({
    entityType,
    entityId,
    isTrash,
    columns,
  });

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
          primaryColumn: 'fileName',
          stackedColumns: ['size', 'createdAt'],
        }}
        actionBar={
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('storage.table.delete'),
                icon: <Trash2 className="h-4 w-4" />,
                variant: 'destructive',
                disabled: isPendingActions,
                onClick: (rows) => handleDelete(rows),
              },
              {
                label: t('storage.table.download'),
                icon: <Download className="h-4 w-4" />,
                onClick: (rows) => handleBulkDownload(rows),
                disabled: isPendingActions,
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
