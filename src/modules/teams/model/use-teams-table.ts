import { error } from 'better-auth/api';
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

import { teamsQueries } from './teams.query';
import { GetTeamQuery, Team } from './teams.schema';

export default function useTeams(columns: ColumnDef<Team>[]) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // ── Local filter/UI state ──────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // ── Paginación y filtros ───────────────────────────────────────────────────
  const { defaultPageSize } = usePaginationConfig();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(defaultPageSize);

  React.useEffect(() => {
    setLimit((curr) => (curr === DEFAULT_PAGE_SIZE ? defaultPageSize : curr));
  }, [defaultPageSize]);

  const [sort] = sorting;

  const sortBy = (sort ? sort.id : 'created_at') as GetTeamQuery['sort_by'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  const nameCol = columnFilters.find((f) => f.id === 'name');
  const name = typeof nameCol?.value === 'string' ? nameCol.value : undefined;

  const createdAtCol = columnFilters.find((f) => f.id === 'created_at' || f.id === 'createdAt');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  const { data, isLoading, isFetching } = teamsQueries.useGetAll({
    page,
    limit,
    is_trash: false,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(name && { search: name }),
    created_at_from: createdFrom ? createdFrom : undefined,
    created_at_to: createdTo ? createdTo : undefined,
  });

  const teams: Team[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: teams,
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

  const { mutate: mutateDelete, isPending: isPendingDelete } = teamsQueries.useSoftDeleteMany();

  const handleDelete = (rows: Row<Team>[]) => {
    mutateDelete(
      rows.map((item) => item.original.id),
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('teams.table.delete'));
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

    handleDelete,
    isPendingActions: isPendingDelete,
  };
}
