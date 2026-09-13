import { CalendarIcon, Download, ExternalLink, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import * as React from 'react';

import { getAuditModuleLabel, getEntityLink } from '@/modules/audit/model/audit.types';
import { useModules } from '@/modules/modules/model/modules.query';

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
  getStorageTypeOptions,
} from '@/features/storage/model/storage-table-utils';
import { useStorageTable } from '@/features/storage/model/use-storage-table';
import { useSettings } from '@/hooks/use-settings';
import { formatBytes, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export function DocumentsTable({
  entityType,
  entityId,
  isTrash = false,
}: DocumentsTableComponentProps) {
  const { t } = useTranslation();
  const { modulesMap } = useModules();
  const { maxUploadSizeBytes } = useSettings();

  const isGlobalStorage = !entityId;
  const maxMB = Math.max(1, Math.ceil(maxUploadSizeBytes / (1024 * 1024)));

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
      ...(isGlobalStorage
        ? ([
            {
              id: 'parentModule',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} label={t('trash.table.parentModule')} />
              ),
              cell: ({ row }) => {
                const mod = row.original.modulePrincipalEntity;
                if (mod) {
                  return (
                    <span className="text-foreground font-medium">
                      {mod.name || getAuditModuleLabel(t, mod.code, modulesMap)}
                    </span>
                  );
                }
                const type = row.original.entityType;
                if (!type) return '-';
                return (
                  <span className="text-foreground font-medium">
                    {getAuditModuleLabel(t, type, modulesMap)}
                  </span>
                );
              },
            },
            {
              id: 'parentEntity',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} label={t('trash.table.parentEntity')} />
              ),
              cell: ({ row }) => {
                const mod = row.original.modulePrincipalEntity;
                if (mod) {
                  const name = mod.entity_name || mod.entity_id || '-';
                  const link = getEntityLink(mod.code, mod.entity_id);

                  if (link && name !== '-') {
                    return (
                      <Link
                        to={link}
                        className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[200px]"
                      >
                        {name}
                      </Link>
                    );
                  }

                  return (
                    <span className="font-medium text-foreground block truncate max-w-[200px]">{name}</span>
                  );
                }

                const type = row.original.entityType;
                const id = row.original.entityId;
                if (!type || !id) return '-';
                const link = getEntityLink(type, id);

                if (link) {
                  return (
                    <Link
                      to={link}
                      className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[200px]"
                    >
                      {id}
                    </Link>
                  );
                }

                return (
                  <span className="font-medium text-foreground block truncate max-w-[200px]">{id}</span>
                );
              },
            },
          ] as ColumnDef<Document>[])
        : []),
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
          options: getStorageTypeOptions(t),
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
        filterFn: (row, id, filterValue) => {
          if (!Array.isArray(filterValue) || filterValue.length !== 2) return true;
          const [minMB, maxMBVal] = filterValue;
          const sizeBytes = Number(row.getValue(id)) || 0;
          const sizeMB = sizeBytes / (1024 * 1024);
          const min = typeof minMB === 'number' ? minMB : 0;
          const max = typeof maxMBVal === 'number' ? maxMBVal : Infinity;
          return sizeMB >= min && sizeMB <= max;
        },

        meta: {
          label: t('storage.table.size'),
          variant: 'range',
          range: [0, maxMB],
          unit: 'MB',
        },
      },
      {
        accessorKey: 'createdAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('storage.table.createdAt')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('createdAt'))}
          </span>
        ),
        meta: {
          label: t('storage.table.createdAt'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
    ],
    [t, isGlobalStorage, modulesMap, maxMB]
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
