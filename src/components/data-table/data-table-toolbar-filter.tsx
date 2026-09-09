import { X } from 'lucide-react';

import * as React from 'react';

import type { Column, Table } from '@tanstack/react-table';

import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { DataTableDebouncedInput } from '@/components/data-table/data-table-debounced-input';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/data-table/data-table-slider-filter';
import { cn } from '@/lib/utils';

import { Selector } from '../selector/selector';

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
  className?: string;
}

export function DataTableToolbarFilter<TData>({
  column,
  className,
}: DataTableToolbarFilterProps<TData>) {
  {
    const columnMeta = column.columnDef.meta;

    const onFilterRender = React.useCallback(() => {
      if (!columnMeta?.variant) return null;

      switch (columnMeta.variant) {
        case 'text':
          return (
            <DataTableDebouncedInput
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(value) => column.setFilterValue(value)}
              className={cn('h-8 w-40 lg:w-56', className)}
            />
          );

        case 'number':
          return (
            <div className="relative">
              <DataTableDebouncedInput
                type="number"
                inputMode="numeric"
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(value) => column.setFilterValue(value)}
                className={cn('h-8 w-40 lg:w-56', className)}
              />
              {columnMeta.unit && (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {columnMeta.unit}
                </span>
              )}
            </div>
          );

        case 'range':
          return (
            <DataTableSliderFilter
              column={column}
              title={columnMeta.label ?? column.id}
              className={className}
            />
          );

        case 'date':
        case 'dateRange':
          return (
            <DataTableDateFilter
              column={column}
              title={columnMeta.label ?? column.id}
              multiple={columnMeta.variant === 'dateRange'}
              applyButton={columnMeta.variant === 'dateRange'}
              className={className}
            />
          );

        case 'boolean':
          return (
            <DataTableFacetedFilter
              column={column}
              title={columnMeta.label ?? column.id}
              options={
                columnMeta.options ?? [
                  { label: 'Sí', value: 'true' },
                  { label: 'No', value: 'false' },
                ]
              }
              multiple={false}
              className={className}
            />
          );

        case 'select':
        case 'multiSelect':
          return (
            <DataTableFacetedFilter
              column={column}
              title={columnMeta.label ?? column.id}
              options={columnMeta.options ?? []}
              multiple={columnMeta.variant === 'multiSelect'}
              applyButton={columnMeta.variant === 'multiSelect'}
              className={className}
            />
          );

        case 'asyncSelect':
          return columnMeta.useGetList ? (
            <Selector
              useGetList={columnMeta.useGetList}
              value={(column.getFilterValue() as string) ?? undefined}
              onChange={(value) => {
                column.setFilterValue(value ?? undefined);
              }}
              placeholder={columnMeta.label}
              className={cn('h-8 w-40 lg:w-56', className)}
            />
          ) : null;

        case 'asyncMultiSelect':
          if (!columnMeta.useGetList) return null;
          return (
            <Selector
              useGetList={columnMeta.useGetList}
              multiple={true}
              applyButton={true}
              value={(column.getFilterValue() as string[]) ?? undefined}
              onChange={(value) => column.setFilterValue(value.length === 0 ? undefined : value)}
              placeholder={columnMeta.label}
              className={cn('h-8 w-40 lg:w-56', className)}
            />
          );

        default:
          return null;
      }
    }, [column, columnMeta]);

    return onFilterRender();
  }
}
