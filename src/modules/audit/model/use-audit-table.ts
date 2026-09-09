import * as React from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { useIsMobile } from '@/hooks/use-mobile';

import { auditQueries } from './audit.query';
import { AuditLogType, GetAuditLogsQuery } from './audit.schema';

export default function useAuditTable(
  columns: ColumnDef<AuditLogType>[],
  options?: { moduleSlug?: string; entityId?: string }
) {
  const isMobile = useIsMobile();

  // ── Local filter/UI state ──────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // ── Pagination and filters ──────────────────────────────────────────────────
  const [page, setPage] = React.useState(1);
  function getInitialLimit() {
    if (typeof window === 'undefined') return 10;
    return window.innerWidth < 768 ? 5 : 10;
  }

  const [limit, setLimit] = React.useState(getInitialLimit);

  const [sort] = sorting;
  const sortBy = (sort ? sort.id : 'createdAt') as GetAuditLogsQuery['sortBy'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  // Get action filter value from TanStack columnFilters
  const actionCol = columnFilters.find((f) => f.id === 'action');
  const actionValue = actionCol?.value;
  const action = (
    Array.isArray(actionValue) && actionValue.length > 0
      ? actionValue[0]
      : typeof actionValue === 'string'
        ? actionValue
        : undefined
  ) as GetAuditLogsQuery['action'] | undefined;

  // Get moduleSlug filter values (multiSelect)
  const moduleSlugCol = columnFilters.find((f) => f.id === 'moduleSlug');
  const moduleSlug =
    Array.isArray(moduleSlugCol?.value) && moduleSlugCol.value.length > 0
      ? (moduleSlugCol.value as string[])
      : undefined;

  // Get userId filter values (asyncMultiSelect)
  const userIdCol = columnFilters.find((f) => f.id === 'userId');
  const userId =
    Array.isArray(userIdCol?.value) && userIdCol.value.length > 0
      ? (userIdCol.value as string[])
      : undefined;

  // Get date range filter values
  const createdAtCol = columnFilters.find((f) => f.id === 'createdAt');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  // Merge general filters with scoped options (e.g. inside companies detail page)
  const queryModuleSlug = options?.moduleSlug ? [options.moduleSlug] : moduleSlug;
  const queryEntityId = options?.entityId;

  const { data, isLoading, isFetching } = auditQueries.useGetAll({
    page,
    limit,
    isTrash: false,
    sortBy,
    sortOrder,
    ...(action && { action }),
    ...(queryModuleSlug && { moduleSlug: queryModuleSlug }),
    ...(queryEntityId && { entityId: queryEntityId }),
    ...(userId && { userId }),
    createdAtFrom: createdFrom ? new Date(createdFrom) : undefined,
    createdAtTo: createdTo ? new Date(createdTo) : undefined,
  });

  const auditLogs: AuditLogType[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: auditLogs,
    columns,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    enableRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

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

  return {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
  };
}
