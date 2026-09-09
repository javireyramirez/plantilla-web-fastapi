import { ListFilter, X } from 'lucide-react';

import * as React from 'react';

import type { Column, Table } from '@tanstack/react-table';

import { DataTableToolbarFilter } from '@/components/data-table/data-table-toolbar-filter';
import { useDataTableI18n } from '@/components/data-table/data-table-i18n';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
}

export function DataTableToolbarMobile<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const i18n = useDataTableI18n();

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  );

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">
          {' '}
          <ListFilter className="text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <div
            role="toolbar"
            aria-orientation="vertical"
            className={cn('flex flex-col items-stretch w-full gap-6 p-1', className)}
            {...props}
          >
            <div className="flex flex-col  items-stretch gap-6">
              {columns.map((column) => (
                <DataTableToolbarFilter
                  key={column.id}
                  column={column}
                  className="w-full justify-start h-10 gap-6"
                />
              ))}
              {isFiltered && (
                <Button
                  aria-label={i18n.toolbar.resetFilters}
                  variant="outline"
                  className="w-full border-dashed mt-2"
                  onClick={onReset}
                >
                  <X />
                  {i18n.toolbar.resetFilters}
                </Button>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-4">
              {children}
              <DataTableViewOptions table={table} className="w-full justify-start h-10" />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
