import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';

import * as React from 'react';

import { useDataTableI18n } from '@/components/data-table/data-table-i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EntityOption {
  id: string;
  name: string;
}

interface UseGetListParams {
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  name?: string;
  [key: string]: any;
}

interface UseGetListResult {
  data?: EntityOption[];
  isLoading: boolean;
}

interface BaseProps {
  useGetList: (params: UseGetListParams) => UseGetListResult;
  disabled?: boolean;
  debounceMs?: number;
  excludeIds?: string[];
  className?: string;
  selectedOptions?: EntityOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  refineMessage?: string;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value?: string;
  onChange: (value: string | undefined) => void;
}

interface MultipleProps extends BaseProps {
  multiple: true;
  applyButton?: boolean;
  applyLabel?: string;
  value?: string[];
  onChange: (value: string[]) => void;
}

export type AsyncSelectProps = SingleProps | MultipleProps;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSelected(value: string, current: string | string[] | undefined): boolean {
  if (!current) return false;
  return Array.isArray(current) ? current.includes(value) : current === value;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Selector({
  useGetList,
  disabled,
  debounceMs = 300,
  excludeIds,
  className,
  selectedOptions,
  multiple,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  refineMessage,
  ...rest
}: AsyncSelectProps) {
  const i18n = useDataTableI18n();

  const _placeholder = placeholder ?? i18n.selector.placeholder;
  const _searchPlaceholder = searchPlaceholder ?? i18n.selector.searchPlaceholder;
  const _emptyMessage = emptyMessage ?? i18n.selector.emptyMessage;
  const _refineMessage = refineMessage ?? i18n.selector.refineMessage;

  const applyButton = multiple ? (rest as MultipleProps).applyButton : false;
  const applyLabel = multiple ? ((rest as MultipleProps).applyLabel ?? 'Apply') : 'Apply';

  const _applyLabel = (rest as any).applyLabel ?? i18n.selector.applyLabel;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Pending selection state — only used when applyButton is true
  const [pendingValue, setPendingValue] = React.useState<string[]>(
    multiple ? ((value as string[]) ?? []) : []
  );

  // Sync pendingValue when popover opens
  React.useEffect(() => {
    if (open && multiple && applyButton) {
      setPendingValue((value as string[]) ?? []);
    }
  }, [open]);

  const debouncedSetSearch = useDebouncedCallback(setDebouncedSearch, debounceMs);

  const { data, isLoading } = useGetList({
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
    name: debouncedSearch || undefined,
  });

  const entities = data ?? [];
  const total: number = entities.length ?? 0;

  const filtered = React.useMemo(
    () => (excludeIds?.length ? entities.filter((e) => !excludeIds.includes(e.id)) : entities),
    [entities, excludeIds]
  );

  // The "active" value for rendering check marks: pending when applyButton, real otherwise
  const activeValue = multiple && applyButton ? pendingValue : value;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSearch(val: string) {
    setSearch(val);
    debouncedSetSearch(val);
  }

  function handleSelect(entity: EntityOption) {
    if (multiple) {
      if (applyButton) {
        // Mutate pending state only, don't call onChange yet
        setPendingValue((prev) =>
          prev.includes(entity.id) ? prev.filter((id) => id !== entity.id) : [...prev, entity.id]
        );
      } else {
        const current = (value as string[] | undefined) ?? [];
        const next = current.includes(entity.id)
          ? current.filter((id) => id !== entity.id)
          : [...current, entity.id];
        (onChange as MultipleProps['onChange'])(next);
      }
    } else {
      const next = value === entity.id ? undefined : entity.id;
      (onChange as SingleProps['onChange'])(next);
      setOpen(false);
    }
  }

  function handleApply() {
    (onChange as MultipleProps['onChange'])(pendingValue);
    setOpen(false);
  }

  function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!multiple) return;
    const current = (value as string[]) ?? [];
    (onChange as MultipleProps['onChange'])(current.filter((v) => v !== id));
  }

  function handleRemoveAll(e: React.MouseEvent) {
    e.stopPropagation();
    (onChange as MultipleProps['onChange'])([]);
  }

  // ── Trigger label ─────────────────────────────────────────────────────────

  const selectedEntities = React.useMemo(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    const ids = Array.isArray(value) ? value : [value];
    return ids.map(
      (id) =>
        entities.find((e) => e.id === id) ??
        selectedOptions?.find((e) => e.id === id) ?? { id, name: id }
    );
  }, [value, entities, selectedOptions]);

  const triggerLabel = React.useMemo(() => {
    if (selectedEntities.length === 0) return _placeholder;
    if (!multiple) return selectedEntities[0]?.name ?? _placeholder;
    return null;
  }, [selectedEntities, multiple, _placeholder]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-auto min-h-9 w-full justify-between font-normal',
            selectedEntities.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {multiple && selectedEntities.length === 1 ? (
              selectedEntities.map((entity) => (
                <Badge key={entity.id} variant="secondary" className="gap-1 pr-1">
                  {entity.name}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(entity.id, e)}
                    className="rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : multiple && selectedEntities.length > 1 ? (
              <Badge variant="secondary" className="gap-1 pr-1">
                {selectedEntities.length}
                <button
                  type="button"
                  onClick={handleRemoveAll}
                  className="rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : (
              <span className="truncate">{triggerLabel}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={_searchPlaceholder}
            value={search}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>{_emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {filtered.map((entity) => (
                    <CommandItem
                      key={entity.id}
                      value={entity.id}
                      onSelect={() => handleSelect(entity)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected(entity.id, activeValue) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {entity.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {total > 20 && (
                  <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                    {total - 20} {_refineMessage}
                  </p>
                )}
              </>
            )}
          </CommandList>

          {multiple && applyButton && (
            <div className="border-t p-2">
              <Button size="sm" className="w-full" onClick={handleApply}>
                {_applyLabel}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
