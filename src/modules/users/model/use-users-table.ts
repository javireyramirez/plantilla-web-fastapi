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

import { usersQueries } from './users.query';
import { GetUsersQuery, Users } from './users.schema';

export default function useUsers(columns: ColumnDef<Users>[]) {
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

  const sortBy = (sort ? sort.id : 'created_at') as GetUsersQuery['sort_by'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  const nameCol = columnFilters.find((f) => f.id === 'name');
  const name = typeof nameCol?.value === 'string' ? nameCol.value : undefined;

  const emailCol = columnFilters.find((f) => f.id === 'email');
  const email = typeof emailCol?.value === 'string' ? emailCol.value : undefined;

  const isSystemCol = columnFilters.find((f) => f.id === 'is_system' || f.id === 'isSystem');
  const isSystemRaw = Array.isArray(isSystemCol?.value) ? isSystemCol.value[0] : isSystemCol?.value;
  const isSystem = isSystemRaw === 'true' ? true : isSystemRaw === 'false' ? false : undefined;

  const emailVerifiedCol = columnFilters.find(
    (f) => f.id === 'email_verified' || f.id === 'emailVerified'
  );
  const emailVerifiedRaw = Array.isArray(emailVerifiedCol?.value)
    ? emailVerifiedCol.value[0]
    : emailVerifiedCol?.value;
  const emailVerified =
    emailVerifiedRaw === 'true' ? true : emailVerifiedRaw === 'false' ? false : undefined;

  const isActiveCol = columnFilters.find((f) => f.id === 'is_active' || f.id === 'isActive');
  const isActiveRaw = Array.isArray(isActiveCol?.value) ? isActiveCol.value[0] : isActiveCol?.value;
  const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;

  const createdAtCol = columnFilters.find((f) => f.id === 'created_at' || f.id === 'createdAt');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  const { data, isLoading, isFetching } = usersQueries.useGetAll({
    page,
    limit,
    is_trash: false,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(name && { name }),
    ...(email && { email }),
    ...(isSystem !== undefined && { is_system: isSystem }),
    ...(isActive !== undefined && { is_active: isActive }),
    ...(emailVerified !== undefined && { email_verified: emailVerified }),
    created_at_from: createdFrom ? createdFrom : undefined,
    created_at_to: createdTo ? createdTo : undefined,
  });

  const users: Users[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: users,
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

  const { mutate: mutateDelete, isPending: isPendingDelete } = usersQueries.useSoftDeleteMany();
  const { mutate: mutateSuspend, isPending: isSuspending } = usersQueries.useSuspendBulk();
  const { mutate: mutateUnsuspend, isPending: isUnsuspending } = usersQueries.useUnsuspendBulk();
  const { mutateAsync: mutateResendInvitation } = usersQueries.useResendInvitation();
  const { mutate: mutateExport, isPending: isPendingExport } = usersQueries.useExport();
  const [isResending, setIsResending] = React.useState(false);

  const handleDelete = (rows: Row<Users>[]) => {
    mutateDelete(
      rows.map((item) => item.original.id),
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('users.table.delete'));
        },
      }
    );
  };

  const handleSuspend = (rows: Row<Users>[]) => {
    mutateSuspend(
      { ids: rows.map((item) => item.original.id) },
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('users.form.suspend'));
        },
        onError: (err: any) => {
          toast.error(err.message || t('users.form.errors.suspend'));
        },
      }
    );
  };

  const handleUnsuspend = (rows: Row<Users>[]) => {
    mutateUnsuspend(
      { ids: rows.map((item) => item.original.id) },
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('users.form.unsuspend'));
        },
        onError: (err: any) => {
          toast.error(err.message || t('users.form.errors.unsuspend'));
        },
      }
    );
  };

  const handleResendInvitation = async (rows: Row<Users>[]) => {
    setIsResending(true);
    try {
      await Promise.all(rows.map((item) => mutateResendInvitation(item.original.id)));
      setRowSelection([]);
      toast.success(t('users.form.resendInvitation'));
    } catch (err: any) {
      toast.error(err.message || t('users.form.errors.resendInvitation'));
    } finally {
      setIsResending(false);
    }
  };

  const handleExport = (rows: Row<Users>[]) => {
    mutateExport(
      {
        ids: rows.map((item) => item.original.id),
      },
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('users.exportSuccess', 'Exportado con éxito'));
        },
        onError: (err: any) => {
          const serverMessage = err?.response?.data?.message || err?.message;
          toast.error(serverMessage || t('users.exportError', 'Error al exportar'));
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
    handleSuspend,
    handleUnsuspend,
    handleResendInvitation,
    handleExport,
    isPendingActions: isPendingDelete || isUnsuspending || isSuspending || isResending || isPendingExport,
  };
}
