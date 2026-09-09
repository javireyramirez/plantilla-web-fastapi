import { Check, Settings2 } from 'lucide-react';

import * as React from 'react';

import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { useDataTableI18n } from '@/components/data-table/data-table-i18n';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DataTableViewOptionsProps<TData> extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  disabled?: boolean;
  clasName?: string;
}

export function DataTableViewOptions<TData>({
  table,
  disabled,
  className,
  ...props
}: DataTableViewOptionsProps<TData>) {
  const i18n = useDataTableI18n();
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()),
    [table]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={i18n.viewOptions.toggleColumns}
          role="combobox"
          variant="outline"
          size="sm"
          className={cn('ml-auto h-8 font-normal', className)}
          disabled={disabled}
        >
          <Settings2 className="text-muted-foreground" />
          {i18n.viewOptions.title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" {...props}>
        <Command>
          <CommandInput placeholder={i18n.viewOptions.searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{i18n.viewOptions.emptyMessage}</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                >
                  <span className="truncate">{column.columnDef.meta?.label ?? column.id}</span>
                  <Check
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      column.getIsVisible() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
