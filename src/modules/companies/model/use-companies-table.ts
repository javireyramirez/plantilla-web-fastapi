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

import { companiesQueries } from './companies.query';
import { Company, GetCompaniesQuery } from './companies.schema';

export default function useCompanies(columns: ColumnDef<Company>[]) {
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

  const sortBy = (sort ? sort.id : 'created_at') as GetCompaniesQuery['sort_by'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  const nameCol = columnFilters.find((f) => f.id === 'name');
  const name = typeof nameCol?.value === 'string' ? nameCol.value : undefined;

  const nifCol = columnFilters.find((f) => f.id === 'nif');
  const nif = typeof nifCol?.value === 'string' ? nifCol.value : undefined;

  const sectorCol = columnFilters.find((f) => f.id === 'sector');
  const sector =
    Array.isArray(sectorCol?.value) && sectorCol.value.length > 0
      ? (sectorCol.value as string[])
      : undefined;

  const createdAtCol = columnFilters.find((f) => f.id === 'created_at' || f.id === 'createdAt');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  const { data, isLoading, isFetching } = companiesQueries.useGetAll({
    page,
    limit,
    is_trash: false,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(name && { name }),
    ...(nif && { nif }),
    ...(sector && { sector }),
    created_at_from: createdFrom ? createdFrom : undefined,
    created_at_to: createdTo ? createdTo : undefined,
  });

  const companies: Company[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  const table = useReactTable({
    data: companies,
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

  const { mutate: mutateDelete, isPending: isPendingDelete } = companiesQueries.useSoftDeleteMany();
  const { mutateAsync: mutateExport, isPending: isPendingExport } = companiesQueries.useExport();

  const handleDelete = (rows: Row<Company>[]) => {
    mutateDelete(
      rows.map((item) => item.original.id),
      {
        onSuccess: () => {
          setRowSelection([]);
          toast.success(t('companies.table.delete'));
        },
      }
    );
  };

  const handleExport = async (rows?: Row<Company>[], format: string = 'csv') => {
    const ids = rows && rows.length > 0 ? rows.map((item) => item.original.id) : undefined;
    try {
      await mutateExport({
        ids,
        format,
        sort_by: sortBy,
        sort_order: sortOrder,
        filters: !ids
          ? {
              ...(name && { name }),
              ...(nif && { nif }),
              ...(sector && { sector }),
              ...(createdFrom && { created_at_from: createdFrom }),
              ...(createdTo && { created_at_to: createdTo }),
            }
          : undefined,
      });
      if (ids) setRowSelection([]);
      toast.success(t('export.success', { defaultValue: 'Exportado con éxito' }));
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(serverMessage || t('export.error', { defaultValue: 'Error al exportar' }));
    }
  };

  return {
    table,
    totalRows,

    isLoading,
    isFetching,
    isMobile,

    limit,

    handleDelete,
    handleExport,
    isPendingExport,
    isPendingActions: isPendingDelete || isPendingExport,
  };
}
