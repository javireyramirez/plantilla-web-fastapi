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

import { Document, DocumentsTableProps } from '@/features/storage/model/storage-table-types';
import { CONTENT_TYPE_OPTIONS } from '@/features/storage/model/storage-table-utils';
import {
  useBulkDeleteDocuments,
  useBulkDownloadZip,
  useDownloadUrl,
  useGetDocuments,
} from '@/features/storage/model/use-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { DEFAULT_PAGE_SIZE, usePaginationConfig } from '@/hooks/use-settings';
import { GetDocumentsQuery } from '@/schemas/storage.schema';

export function useStorageTable({
  entityType,
  entityId,
  isTrash = false,
  columns,
}: DocumentsTableProps) {
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

  const sortBy = (sort ? sort.id : 'createdAt') as GetDocumentsQuery['sortBy'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  const fileNameCol = columnFilters.find((f) => f.id === 'fileName');
  const fileName = typeof fileNameCol?.value === 'string' ? fileNameCol.value : undefined;

  const contentTypeCol = columnFilters.find((f) => f.id === 'contentType');
  const contentTypes =
    Array.isArray(contentTypeCol?.value) && contentTypeCol.value.length > 0
      ? contentTypeCol.value.flatMap((selectedValue: string) => {
          const option = CONTENT_TYPE_OPTIONS.find((opt) => opt.value === selectedValue);
          return option ? option.mimeTypes : [selectedValue];
        })
      : undefined;

  const sizeCol = columnFilters.find((f) => f.id === 'size');
  const [sizeMin, sizeMax] = Array.isArray(sizeCol?.value) ? sizeCol.value : [undefined, undefined];

  const createdAtCol = columnFilters.find((f) => f.id === 'createdAt');
  const [createdFrom, createdTo] = Array.isArray(createdAtCol?.value)
    ? createdAtCol.value
    : [undefined, undefined];

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useGetDocuments(entityType, entityId, {
    isTrash,
    page,
    limit,
    sortBy,
    sortOrder,
    ...(fileName && { fileName }),
    ...(contentTypes && { contentTypes }),
    sizeMin:
      sizeMin !== undefined && sizeMin !== null && !Number.isNaN(Number(sizeMin))
        ? Math.round(Number(sizeMin) * 1024 * 1024)
        : undefined,
    sizeMax:
      sizeMax !== undefined && sizeMax !== null && !Number.isNaN(Number(sizeMax))
        ? Math.round(Number(sizeMax) * 1024 * 1024)
        : undefined,
    createdFrom: createdFrom ? createdFrom : undefined,
    createdTo: createdTo ? createdTo : undefined,
  });

  const documents: Document[] = data?.documents ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total;

  const table = useReactTable({
    data: documents,
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

  //Funcion de borrado y descarga
  const { mutate: mutateDelete, isPending: isPendingDelete } = useBulkDeleteDocuments();

  const handleDelete = (rows: Row<Document>[]) => {
    mutateDelete(
      { entityType: entityType ?? '', entityId: entityId ?? '', documentIds: rows.map((item) => item.original.id) },
      { onSuccess: () => setRowSelection([]) }
    );
  };

  const { mutate: mutateDownloadUrl } = useDownloadUrl();

  const handleDownloadUrl = (documentId: string) => {
    mutateDownloadUrl({ entityType: entityType ?? '', entityId: entityId ?? '', documentId });
  };

  const { mutateAsync: downloadZip, isPending: isPendingDownloadZip } = useBulkDownloadZip();

  const handleBulkDownload = async (rows: Row<Document>[]) => {
    const documentIds = rows.map((r) => r.original.id);
    if (documentIds.length === 0) return;
    await downloadZip({ entityType: entityType ?? '', entityId: entityId ?? '', documentIds });
  };

  return {
    table,
    totalRows,

    isLoading,
    isFetching,
    isMobile,

    limit,

    handleDownloadUrl,
    handleDelete,
    handleBulkDownload,
    isPendingActions: isPendingDelete || isPendingDownloadZip,
  };
}
