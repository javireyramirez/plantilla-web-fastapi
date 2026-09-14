import * as React from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { useIsMobile } from '@/hooks/use-mobile';

import { settingsQueries } from './settings.query';
import { Setting } from './settings.schema';

export default function useSettingsTable(columns: ColumnDef<Setting>[]) {
  const isMobile = useIsMobile();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'category', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);

  const { data: rawSettings = [], isLoading, isFetching } = settingsQueries.useGetAll();

  const table = useReactTable({
    data: rawSettings,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize: limit })
          : updater;
      if (next.pageSize !== limit) {
        setPage(1);
      } else {
        setPage(next.pageIndex + 1);
      }
      setLimit(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return {
    table,
    totalRows: rawSettings.length,
    isLoading,
    isFetching,
    isMobile,
    limit,
    globalFilter,
    setGlobalFilter,
  };
}
