import { Check, Settings2 } from 'lucide-react';

import * as React from 'react';

import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { useDataTableI18n } from '@/components/data-table/data-table-i18n';
import { useTranslation } from 'react-i18next';
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
  className?: string;
}

export function DataTableViewOptions<TData>({
  table,
  disabled,
  className,
  ...props
}: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation();
  const i18n = useDataTableI18n();
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanHide()),
    [table]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={t('dataTable.viewOptions.toggleColumns', { defaultValue: i18n.viewOptions.toggleColumns })}
          role="combobox"
          variant="outline"
          size="sm"
          className={cn('ml-auto h-8 font-normal', className)}
          disabled={disabled}
        >
          <Settings2 className="text-muted-foreground" />
          {t('dataTable.viewOptions.title', { defaultValue: i18n.viewOptions.title ?? 'Vista' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" {...props}>
        <Command>
          <CommandInput
            placeholder={t('dataTable.viewOptions.searchPlaceholder', { defaultValue: i18n.viewOptions.searchPlaceholder })}
          />
          <CommandList>
            <CommandEmpty>
              {t('dataTable.viewOptions.emptyMessage', { defaultValue: i18n.viewOptions.emptyMessage })}
            </CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label ??
                      (typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id)}
                  </span>
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
