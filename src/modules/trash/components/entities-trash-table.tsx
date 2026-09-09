import { CalendarIcon, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import * as React from 'react';

import { type ColumnDef, Row } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFloatingBar } from '@/components/data-table/data-table-floating-bar';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
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
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getEntityLink } from '@/modules/audit/model/audit.types';
import { modulesQueries } from '@/modules/modules/model/modules.query';

import { TrashBinItemS } from '../model/trash.schema';
import useTrashTable from '../model/use-trash-table';

function useModulesOptions() {
  const { data, isLoading } = modulesQueries.useGetList();

  return {
    data:
      data?.map((m: { id: string; slug: string; name: string }) => ({
        id: m.slug,
        name: m.name ?? m.slug,
      })) ?? [],
    isLoading,
  };
}

export function EntitiesTrashTable() {
  const { t } = useTranslation();
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<Row<TrashBinItemS>[]>([]);

  const columns = React.useMemo<ColumnDef<TrashBinItemS>[]>(
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
            aria-label={t('trash.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('trash.table.selectFila')}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'displayName',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('trash.table.displayName')} />
        ),
        cell: ({ row }) => {
          const link = getEntityLink(row.original.moduleSlug, row.original.entityId);
          const name = (row.getValue('displayName') as string) || '-';
          if (link) {
            return (
              <Link
                to={link}
                className="font-medium text-blue-500 hover:text-blue-700 hover:underline block truncate max-w-[250px]"
              >
                {name}
              </Link>
            );
          }
          return (
            <span className="font-medium text-foreground block truncate max-w-[250px]">{name}</span>
          );
        },
        meta: {
          label: t('trash.table.displayName'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'moduleSlug',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('trash.table.module')} />
        ),
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
          label: t('trash.table.module'),
          variant: 'asyncMultiSelect',
          useGetList: useModulesOptions,
        },
      },
      {
        accessorKey: 'deletedAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('trash.table.deletedAt')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('deletedAt') as string)}
          </span>
        ),
        meta: {
          label: t('trash.table.deletedAt'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
      {
        accessorKey: 'deletedBy',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('trash.table.deletedBy')} />
        ),
        cell: ({ row }) => {
          const deletor = row.original.deletor;
          const name = deletor?.name || row.original.deletedByName;
          const email = deletor?.email || row.original.deletedByEmail;
          if (name && email) {
            return (
              <span className="text-foreground text-sm font-medium">
                {name} <span className="text-muted-foreground text-xs">({email})</span>
              </span>
            );
          }
          return (
            <span className="text-foreground text-sm font-medium">
              {name || email || row.original.deletedBy || '-'}
            </span>
          );
        },
      },
      {
        accessorKey: 'expiresAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('trash.table.expiresAt')} />
        ),
        cell: ({ row }) => {
          const dateVal = row.getValue('expiresAt');
          if (!dateVal) return '';
          const formattedDate = formatDate(dateVal as string);

          const now = new Date();
          const exp = new Date(dateVal as string);
          now.setHours(0, 0, 0, 0);
          exp.setHours(0, 0, 0, 0);
          const diffTime = exp.getTime() - now.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          let daysText = '';
          if (diffDays < 0) {
            daysText = ` (${t('trash.table.expired') || 'expirado'})`;
          } else if (diffDays === 0) {
            daysText = ` (${t('trash.table.today') || 'hoy'})`;
          } else {
            daysText = ` (${diffDays} ${t('trash.table.daysLeft') || 'días'})`;
          }

          return (
            <span className="text-muted-foreground tabular-nums text-sm">
              {formattedDate} {daysText}
            </span>
          );
        },
        meta: {
          label: t('trash.table.expiresAt'),
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
    handleRestore,
    handleDelete,
    isPendingActions,
  } = useTrashTable(columns, 'entities');

  const triggerDeleteConfirm = (rows: Row<TrashBinItemS>[]) => {
    setSelectedRows(rows);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    handleDelete(selectedRows);
    setOpenDeleteDialog(false);
    setSelectedRows([]);
  };

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
          primaryColumn: 'displayName',
          stackedColumns: ['moduleSlug', 'deletedAt'],
        }}
        actionBar={
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('trash.actions.restoreSelected'),
                icon: <RotateCcw className="h-4 w-4" />,
                disabled: isPendingActions,
                onClick: (rows) => handleRestore(rows),
                className:
                  'border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white gap-2',
              },
              {
                label: t('trash.actions.deleteSelectedPermanent'),
                icon: <Trash2 className="h-4 w-4" />,
                disabled: isPendingActions,
                onClick: (rows) => triggerDeleteConfirm(rows),
                className:
                  'border-destructive text-destructive hover:bg-destructive hover:text-white',
              },
            ]}
          />
        }
      >
        {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
      </DataTable>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trash.dialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('trash.dialog.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPendingActions}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPendingActions}
              variant="destructive"
            >
              {t('trash.actions.deletePermanent')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
