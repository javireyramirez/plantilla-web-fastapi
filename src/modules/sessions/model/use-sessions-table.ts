import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';

import { useIsMobile } from '@/hooks/use-mobile';
import { DEFAULT_PAGE_SIZE, usePaginationConfig } from '@/hooks/use-settings';
import { markSigningOut } from '@/lib/auth-flags';

import { sessionsQueries } from './sessions.query';
import { GetSessionsQuery, SessionAdminType } from './sessions.schema';

interface UseSessionsTableOptions {
  userId?: string;
}

export default function useSessionsTable(
  columns: ColumnDef<SessionAdminType>[],
  options?: UseSessionsTableOptions
) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Local filter/UI state ──────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // ── Pagination and filters ──────────────────────────────────────────────────
  const { defaultPageSize } = usePaginationConfig();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(defaultPageSize);

  React.useEffect(() => {
    setLimit((curr) => (curr === DEFAULT_PAGE_SIZE ? defaultPageSize : curr));
  }, [defaultPageSize]);

  const [sort] = sorting;
  const sortBy = sort ? sort.id : 'created_at';
  const sortOrder: 'desc' | 'asc' = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  // Extract is_valid status filter safely
  const statusCol = columnFilters.find((f) => f.id === 'status' || f.id === 'is_valid');
  const statusVal = Array.isArray(statusCol?.value) ? statusCol.value[0] : statusCol?.value;
  const isValid =
    statusVal === true || statusVal === 'true'
      ? true
      : statusVal === false || statusVal === 'false'
        ? false
        : undefined;

  // Extract date range filter values
  const createdAtCol = columnFilters.find((f) => f.id === 'created_at');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  const expiresAtCol = columnFilters.find((f) => f.id === 'expires_at');
  const [expiresFrom, expiresTo] = Array.isArray(expiresAtCol?.value)
    ? expiresAtCol.value
    : [undefined, undefined];

  // Search filter
  const userCol = columnFilters.find((f) => f.id === 'user' || f.id === 'user_name' || f.id === 'search');
  const searchVal = typeof userCol?.value === 'string' ? userCol.value : undefined;

  const queryUserId = options?.userId;

  const queryParams: GetSessionsQuery = {
    page,
    limit,
    is_trash: false,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(isValid !== undefined && { is_valid: isValid }),
    ...(queryUserId && { user_id: queryUserId }),
    ...(searchVal && { search: searchVal }),
    created_at_from: createdFrom || undefined,
    created_at_to: createdTo || undefined,
    expires_at_from: expiresFrom || undefined,
    expires_at_to: expiresTo || undefined,
  };

  const { data, isLoading, isFetching, refetch } = sessionsQueries.useGetAll(queryParams);

  const sessions: SessionAdminType[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: sessions,
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
    enableRowSelection: (row) => row.original.is_valid,
    onRowSelectionChange: setRowSelection,
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

  // ── Revoke & Self-Revoke actions ──────────────────────────────────────────
  const { mutateAsync: mutateRevoke, isPending: isPendingRevoke } = sessionsQueries.useRevoke();
  const { mutateAsync: mutateBulkRevoke, isPending: isPendingBulkRevoke } = sessionsQueries.useBulkRevoke();
  const { mutateAsync: mutateExport, isPending: isPendingExport } = sessionsQueries.useExport();

  const handleSelfRevokeLogout = React.useCallback(() => {
    markSigningOut();
    queryClient.clear();
    navigate('/signin', { replace: true });
  }, [queryClient, navigate]);

  const handleRevoke = React.useCallback(
    async (session: SessionAdminType) => {
      try {
        const res = await mutateRevoke(session.id);
        toast.success(
          res.message ||
            t('sessions.toast.revokeSuccess', { defaultValue: 'Sesión revocada correctamente' })
        );
        if (session.is_current) {
          handleSelfRevokeLogout();
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message;
        toast.error(
          msg || t('sessions.toast.revokeError', { defaultValue: 'Error al revocar la sesión' })
        );
      }
    },
    [mutateRevoke, t, handleSelfRevokeLogout]
  );

  const handleBulkRevoke = React.useCallback(
    async (rows: Row<SessionAdminType>[]) => {
      const activeRows = rows.filter((r) => r.original.is_valid);
      if (activeRows.length === 0) return;

      const hasCurrent = activeRows.some((r) => r.original.is_current);
      const ids = activeRows.map((r) => r.original.id);

      try {
        const res = await mutateBulkRevoke(ids);
        setRowSelection({});

        if (res.unprocessed_ids && res.unprocessed_ids.length > 0) {
          toast.warning(
            t('sessions.toast.bulkPartialSuccess', {
              count: res.count,
              unprocessed: res.unprocessed_ids.length,
              defaultValue: `Se revocaron ${res.count} sesiones. ${res.unprocessed_ids.length} no pudieron ser procesadas.`,
            })
          );
        } else {
          toast.success(
            res.message ||
              t('sessions.toast.bulkSuccess', {
                count: res.count,
                defaultValue: `Se han revocado ${res.count} sesiones correctamente`,
              })
          );
        }

        if (hasCurrent) {
          handleSelfRevokeLogout();
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message;
        toast.error(
          msg ||
            t('sessions.toast.bulkError', {
              defaultValue: 'Error al revocar las sesiones seleccionadas',
            })
        );
      }
    },
    [mutateBulkRevoke, t, handleSelfRevokeLogout]
  );

  const handleExport = React.useCallback(
    async (rows?: Row<SessionAdminType>[], format: string = 'csv') => {
      const ids = rows && rows.length > 0 ? rows.map((item) => item.original.id) : undefined;
      try {
        await mutateExport({
          ids,
          format,
          sort_by: sortBy,
          sort_order: sortOrder,
          is_trash: false,
          filters: !ids
            ? {
                ...(isValid !== undefined && { is_valid: isValid }),
                ...(queryUserId && { user_id: queryUserId }),
                ...(searchVal && { search: searchVal }),
                ...(createdFrom && { created_at_from: createdFrom }),
                ...(createdTo && { created_at_to: createdTo }),
                ...(expiresFrom && { expires_at_from: expiresFrom }),
                ...(expiresTo && { expires_at_to: expiresTo }),
              }
            : undefined,
        });
        if (ids) setRowSelection({});
        toast.success(t('export.success', { defaultValue: 'Exportado con éxito' }));
      } catch (err: any) {
        const serverMessage = err?.response?.data?.message || err?.message;
        toast.error(serverMessage || t('export.error', { defaultValue: 'Error al exportar' }));
      }
    },
    [mutateExport, sortBy, sortOrder, isValid, queryUserId, searchVal, createdFrom, createdTo, expiresFrom, expiresTo, t]
  );

  return {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    refetch,
    handleRevoke,
    handleBulkRevoke,
    handleExport,
    isPendingRevoke,
    isPendingBulkRevoke,
    isPendingExport,
    isPendingActions: isPendingRevoke || isPendingBulkRevoke || isPendingExport,
  };
}
