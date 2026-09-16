import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import * as React from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  Row,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { useIsMobile } from '@/hooks/use-mobile';
import { DEFAULT_PAGE_SIZE, usePaginationConfig } from '@/hooks/use-settings';

import { trashQueries } from './trash.query';
import { GetTrashQuery, TrashBinItemS } from './trash.schema';

export type TrashCategory = 'entities' | 'storage';

export default function useTrashTable(
  columns: ColumnDef<TrashBinItemS>[],
  category: TrashCategory
) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // ── Local filter/UI state ──────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // ── Pagination and filters ───────────────────────────────────────────────────
  const { defaultPageSize } = usePaginationConfig();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(defaultPageSize);

  React.useEffect(() => {
    setLimit((curr) => (curr === DEFAULT_PAGE_SIZE ? defaultPageSize : curr));
  }, [defaultPageSize]);

  const [sort] = sorting;

  const sortBy = (sort ? sort.id : 'deleted_at') as GetTrashQuery['sort_by'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  const searchCol = columnFilters.find(
    (f) => f.id === 'display_name' || f.id === 'displayName' || f.id === 'name'
  );
  const search = typeof searchCol?.value === 'string' ? searchCol.value : undefined;

  const deletedAtCol = columnFilters.find((f) => f.id === 'deleted_at' || f.id === 'deletedAt');
  const [deletedAtFrom, deletedAtTo] = Array.isArray(deletedAtCol?.value)
    ? deletedAtCol.value
    : [undefined, undefined];

  const expiresAtCol = columnFilters.find((f) => f.id === 'expires_at' || f.id === 'expiresAt');
  const [expiresAtFrom, expiresAtTo] = Array.isArray(expiresAtCol?.value)
    ? expiresAtCol.value
    : [undefined, undefined];

  const moduleSlugCol = columnFilters.find(
    (f) => f.id === 'module_slug' || f.id === 'moduleSlug' || f.id === 'entity_type'
  );
  const moduleSlug =
    Array.isArray(moduleSlugCol?.value) && moduleSlugCol.value.length > 0
      ? (moduleSlugCol.value as string[])
      : typeof moduleSlugCol?.value === 'string'
        ? [moduleSlugCol.value]
        : undefined;

  const { data, isLoading, isFetching } = trashQueries.useGetTrash({
    page,
    limit,
    category,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(search && { search }),
    ...(moduleSlug && { entity_type: moduleSlug }),
    ...(deletedAtFrom && { deleted_at_from: deletedAtFrom }),
    ...(deletedAtTo && { deleted_at_to: deletedAtTo }),
    ...(expiresAtFrom && { expires_at_from: expiresAtFrom }),
    ...(expiresAtTo && { expires_at_to: expiresAtTo }),
  });

  const trashItems: TrashBinItemS[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: trashItems,
    columns,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,

    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },

    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPage(1);
    },

    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;

      if (next.pageSize !== limit) {
        setPage(1);
      } else {
        setPage(next.pageIndex + 1);
      }
      setLimit(next.pageSize);
    },
  });

  const { mutate: mutateRestore, isPending: isPendingRestore } = trashQueries.useBulkRestore();
  const { mutate: mutateDelete, isPending: isPendingDelete } = trashQueries.useBulkDelete();

  const handleRestore = (rows: Row<TrashBinItemS>[]) => {
    mutateRestore(
      { ids: rows.map((item) => item.original.id) },
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('trash.toast.restoreSuccess'));
        },
        onError: () => {
          toast.error(t('trash.toast.restoreError'));
        },
      }
    );
  };

  const handleDelete = (rows: Row<TrashBinItemS>[]) => {
    mutateDelete(
      { ids: rows.map((item) => item.original.id) },
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('trash.toast.deleteSuccess'));
        },
        onError: () => {
          toast.error(t('trash.toast.deleteError'));
        },
      }
    );
  };

  return {
    table,
    totalRows,

    isLoading,
    isFetching,
    isMobile,

    limit,

    handleRestore,
    handleDelete,
    isPendingActions: isPendingRestore || isPendingDelete,
  };
}
