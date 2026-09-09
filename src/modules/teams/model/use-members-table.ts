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

import { teamsQueries } from './teams.query';
import { GetTeamMembersQuery, TeamMemberWithRelations } from './teams.schema';

export default function useMembers(teamId: string, columns: ColumnDef<TeamMemberWithRelations>[]) {
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

  const sortBy = (sort ? sort.id : 'joinedAt') as GetTeamMembersQuery['sortBy'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  const nameCol = columnFilters.find((f) => f.id === 'name');
  const name = typeof nameCol?.value === 'string' ? nameCol.value : undefined;

  const joinedAtCol = columnFilters.find((f) => f.id === 'joinedAt');
  const [joinedFrom, joinedTo] = Array.isArray(joinedAtCol?.value)
    ? joinedAtCol.value
    : [undefined, undefined];

  const { data, isLoading, isFetching } = teamsQueries.useGetMembers(teamId, {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(name && { name }),
    // NOTE: confirm these are the actual query param names your API expects
    // for filtering by the joinedAt range.
    joinedFrom: joinedFrom ? joinedFrom : undefined,
    joinedTo: joinedTo ? joinedTo : undefined,
  });

  const members: TeamMemberWithRelations[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;
  // NOTE: only the current page's userIds. If members can span more pages
  // than fit in one fetch, consider a dedicated unpaginated endpoint for
  // accurate exclusion in the "add member" selector.
  const memberUserIds: string[] = members.map((m) => m.userId);

  const table = useReactTable({
    data: members,
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

  const { mutate: mutateRemoveBulk, isPending: isPendingRemove } =
    teamsQueries.useRemoveMembersBulk();

  const handleRemove = (rows: Row<TeamMemberWithRelations>[]) => {
    mutateRemoveBulk(
      {
        teamId,
        body: { userIds: rows.map((item) => item.original.userId) },
      },
      {
        onSuccess: () => {
          setRowSelection({});
          toast.success(t('teamMembers.table.removed'));
        },
        onError: () => {
          toast.error(t('teamMembers.table.removeError'));
        },
      }
    );
  };

  const { mutate: mutateAddBulk, isPending: isPendingAddBulk } = teamsQueries.useAddMembersBulk();
  const { mutate: mutateAddMember, isPending: isPendingAddMember } = teamsQueries.useAddMembers();

  const handleAddMembers = (userIds: string[]) => {
    if (userIds.length === 0) return;
    if (userIds.length === 1) {
      mutateAddMember(
        { teamId, body: { userId: userIds[0] } },
        {
          onSuccess: () => {
            toast.success(t('teamMembers.added'));
          },
          onError: () => {
            toast.error(t('teamMembers.addError'));
          },
        }
      );
      return;
    }

    mutateAddBulk(
      { teamId, body: { userIds } },
      {
        onSuccess: () => {
          toast.success(t('teamMembers.addedMany'));
        },
        onError: () => {
          toast.error(t('teamMembers.addError'));
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

    memberUserIds,

    handleRemove,
    isPendingActions: isPendingRemove,

    handleAddMembers,
    isPendingAdd: isPendingAddMember || isPendingAddBulk,
  };
}
