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

import { usersQueries } from './users.query';
import { ResponseTeamRoleBase } from './users.schema';

export default function useUserTeams(columns: ColumnDef<ResponseTeamRoleBase>[], userId: string) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // ── Local filter/UI state ──────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // ── Paginación y filtros ───────────────────────────────────────────────────
  const [page, setPage] = React.useState(1);
  function getInitialLimit() {
    if (typeof window === 'undefined') return 10;
    return window.innerWidth < 768 ? 5 : 10;
  }
  const [limit, setLimit] = React.useState(getInitialLimit);

  const [sort] = sorting;
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'asc';

  const nameCol = columnFilters.find((f) => f.id === 'name');
  const name = typeof nameCol?.value === 'string' ? nameCol.value : undefined;

  const createdAtCol = columnFilters.find((f) => f.id === 'joinedAt');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  // ── React Query Fetch ──────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = usersQueries.useGetTeamAssignments(userId, {
    page,
    limit,
    isTrash: false,
    sortBy: 'name',

    sortOrder,
    ...(name && { name }),
    createdAtFrom: createdFrom ? createdFrom : undefined,
    createdAtTo: createdTo ? createdTo : undefined,
  });

  const teams: ResponseTeamRoleBase[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  // ── TanStack Table Instance ────────────────────────────────────────────────
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

  // ── Mutations ──────────────────────────────────────────────────────────────
  const { mutate: mutateRemove, isPending: isPendingRemove } =
    usersQueries.useRemoveTeamAssignments(userId);
  const { mutate: mutateAdd, isPending: isPendingAdd } = usersQueries.useAddTeamAssignments(userId);

  const assignedTeamIds = teams.map((t) => t.id);

  const handleRemove = (rows: Row<ResponseTeamRoleBase>[]) => {
    mutateRemove(
      { teams: rows.map((item) => item.original.id) },
      {
        onSuccess: () => {
          setRowSelection({});
          toast.success(t('teams.table.remove_success'));
        },
      }
    );
  };

  const handleAdd = (rows: Row<ResponseTeamRoleBase>[]) => {
    mutateAdd(
      { teams: rows.map((item) => item.original.id) },
      {
        onSuccess: () => {
          setRowSelection({});
          toast.success(t('teams.table.add_success'));
        },
      }
    );
  };

  const handleAddTeams = (teamIds: string[]) => {
    mutateAdd(
      { teams: teamIds },
      {
        onSuccess: () => {
          toast.success(t('teams.table.add_success'));
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
    mutateAdd,
    handleRemove,
    handleAdd,
    handleAddTeams,
    assignedTeamIds,
    isPendingAdd,
    isPendingActions: isPendingAdd || isPendingRemove,
  };
}
