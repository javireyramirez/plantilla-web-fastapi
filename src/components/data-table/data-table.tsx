// data-table-mobile.tsx
import type * as React from 'react';

import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { useDataTableI18n } from '@/components/data-table/data-table-i18n';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getColumnPinningStyle } from '@/lib/data-table';
import { cn } from '@/lib/utils';

interface MobileStackConfig {
  /** ID de la columna que actúa como título principal de la tarjeta */
  primaryColumn: string;
  /** IDs de columnas que se apilan debajo del título */
  stackedColumns: string[];
}

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  totalCount?: number;
  /** Config para la vista móvil. Si no se pasa, se usa la tabla normal siempre. */
  mobileConfig?: MobileStackConfig;
}

export function DataTable<TData>({
  table,
  actionBar,
  totalCount,
  children,
  className,
  mobileConfig,
  ...props
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const allColumns = table.getAllColumns();
  const i18n = useDataTableI18n();

  return (
    <div className={cn('flex w-full flex-col gap-2.5 overflow-auto', className)} {...props}>
      {children}

      {/* ── Vista móvil: tarjetas ── */}

      {mobileConfig && (
        <div className="block md:hidden space-y-2">
          <div className="flex items-center gap-2 px-4">
            {' '}
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label={i18n.table.selectAll}
              className="mt-0.5 shrink-0"
            />
            <span className="text-xs text-muted-foreground">{i18n.table.selectAll}</span>
          </div>
          {rows.length ? (
            rows.map((row) => {
              const cellMap = Object.fromEntries(
                row.getVisibleCells().map((cell) => [cell.column.id, cell])
              );

              const primaryCell = cellMap[mobileConfig.primaryColumn];
              const stackedCells = mobileConfig.stackedColumns
                .map((id) => cellMap[id])
                .filter(Boolean);

              return (
                <div
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'rounded-md border bg-card px-4 py-3 shadow-sm',
                    'data-[state=selected]:bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      aria-label={i18n.table.selectRow}
                      className="mt-0.5 shrink-0"
                    />

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      {primaryCell && (
                        <div className="text-sm font-semibold text-foreground">
                          {flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}
                        </div>
                      )}
                      {stackedCells.length > 0 && (
                        <dl className="mt-2 space-y-1">
                          {stackedCells.map((cell) => (
                            <div key={cell.id} className="flex items-baseline gap-1.5">
                              <dt className="shrink-0 text-xs text-muted-foreground">
                                {cell.column.columnDef.meta?.label ?? cell.column.id}:
                              </dt>
                              <dd className="text-xs text-foreground">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{i18n.mobile.noResults}</p>
          )}
        </div>
      )}

      {/* ── Vista desktop: tabla normal ── */}
      <div className={cn('overflow-hidden rounded-md border', mobileConfig && 'hidden md:block')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ ...getColumnPinningStyle({ column: header.column }) }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ ...getColumnPinningStyle({ column: cell.column }) }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="h-24 text-center">
                  {i18n.table.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} totalCount={totalCount} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}
