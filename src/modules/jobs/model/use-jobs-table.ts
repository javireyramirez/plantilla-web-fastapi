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
import { DEFAULT_PAGE_SIZE, usePaginationConfig } from '@/hooks/use-settings';
import { jobsQueries } from './jobs.query';
import { GetJobsQuery, JobType } from './jobs.schema';
import { JobStatus } from './jobs.types';

export default function useJobsTable(
  columns: ColumnDef<JobType>[],
  options?: { entityType?: string; entityId?: string }
) {
  const isMobile = useIsMobile();

  // ── Local filter/UI state ──────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // ── Pagination and filters ──────────────────────────────────────────────────
  const { defaultPageSize } = usePaginationConfig();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(defaultPageSize);

  React.useEffect(() => {
    setLimit((curr) => (curr === DEFAULT_PAGE_SIZE ? defaultPageSize : curr));
  }, [defaultPageSize]);

  const [sort] = sorting;
  const sortBy = (sort ? sort.id : 'created_at') as GetJobsQuery['sort_by'];
  const sortOrder: 'desc' | 'asc' = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  // Get status filter value from TanStack columnFilters
  const statusCol = columnFilters.find((f) => f.id === 'status');
  const statusValue = statusCol?.value;
  const status = (
    Array.isArray(statusValue) && statusValue.length > 0
      ? statusValue[0]
      : typeof statusValue === 'string'
        ? statusValue
        : undefined
  ) as JobStatus | undefined;

  // Get entity_type filter value
  const entityTypeCol = columnFilters.find((f) => f.id === 'entity_type');
  const entityType =
    Array.isArray(entityTypeCol?.value) && entityTypeCol.value.length > 0
      ? (entityTypeCol.value[0] as string)
      : typeof entityTypeCol?.value === 'string'
        ? entityTypeCol.value
        : undefined;

  // Get date range filter values
  const createdAtCol = columnFilters.find((f) => f.id === 'created_at');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  // Search filter (from name or global search)
  const nameCol = columnFilters.find((f) => f.id === 'name');
  const search = typeof nameCol?.value === 'string' ? nameCol.value : undefined;

  const queryParams: GetJobsQuery = {
    page,
    limit,
    is_trash: false,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(status && { status }),
    ...(entityType ? { entity_type: entityType } : options?.entityType ? { entity_type: options.entityType } : {}),
    ...(options?.entityId && { entity_id: options.entityId }),
    ...(search && { search, name: search }),
    created_at_from: createdFrom || undefined,
    created_at_to: createdTo || undefined,
  };

  const { data, isLoading, isFetching, refetch } = jobsQueries.useGetAll(queryParams);

  const jobs: JobType[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: jobs,
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
    refetch,
  };
}
