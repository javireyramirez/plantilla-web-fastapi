import { CalendarIcon, XCircle } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import * as React from 'react';

import type { Column } from '@tanstack/react-table';

import { useDataTableI18n } from '@/components/data-table/data-table-i18n';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type DateSelection = Date[] | DateRange;

function getIsDateRange(value: DateSelection): value is DateRange {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function parseAsDate(timestamp: number | string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  const numericTimestamp = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  const date = new Date(numericTimestamp);
  return !Number.isNaN(date.getTime()) ? date : undefined;
}

function parseColumnFilterValue(value: unknown) {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'number' || typeof item === 'string') {
        return item;
      }
      return undefined;
    });
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [value];
  }

  return [];
}

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  multiple?: boolean;
  applyButton?: boolean;
  className?: string;
}

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple,
  applyButton,
  className,
}: DataTableDateFilterProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const columnFilterValue = column.getFilterValue();
  const i18n = useDataTableI18n();

  const selectedDates = React.useMemo<DateSelection>(() => {
    if (!columnFilterValue) {
      return multiple ? { from: undefined, to: undefined } : [];
    }

    if (multiple) {
      const timestamps = parseColumnFilterValue(columnFilterValue);
      return {
        from: parseAsDate(timestamps[0]),
        to: parseAsDate(timestamps[1]),
      };
    }

    const timestamps = parseColumnFilterValue(columnFilterValue);
    const date = parseAsDate(timestamps[0]);
    return date ? [date] : [];
  }, [columnFilterValue, multiple]);

  // Pending selection state — only used when applyButton is true
  const [pendingDates, setPendingDates] = React.useState<DateSelection>(
    multiple ? { from: undefined, to: undefined } : []
  );

  // Sync pendingDates when popover opens
  React.useEffect(() => {
    if (open && multiple && applyButton) {
      setPendingDates(selectedDates);
    }
  }, [open, selectedDates, multiple, applyButton]);

  const activeDates = multiple && applyButton ? pendingDates : selectedDates;

  const handleSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      if (multiple && applyButton) {
        if (!date) {
          setPendingDates({ from: undefined, to: undefined });
        } else if (!('getTime' in date)) {
          setPendingDates(date);
        }
      } else {
        if (!date) {
          column.setFilterValue(undefined);
          return;
        }

        if (multiple && !('getTime' in date)) {
          const from = date.from?.getTime();
          const to = date.to?.getTime();
          column.setFilterValue(from || to ? [from, to] : undefined);
        } else if (!multiple && 'getTime' in date) {
          column.setFilterValue(date.getTime());
        }
      }
    },
    [column, multiple, applyButton]
  );

  const handleApply = React.useCallback(() => {
    if (multiple && getIsDateRange(pendingDates)) {
      const from = pendingDates.from?.getTime();
      const to = pendingDates.to?.getTime();
      column.setFilterValue(from || to ? [from, to] : undefined);
    }
    setOpen(false);
  }, [column, multiple, pendingDates]);

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      column.setFilterValue(undefined);
    },
    [column]
  );

  const hasValue = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return false;
      return selectedDates.from || selectedDates.to;
    }
    if (!Array.isArray(selectedDates)) return false;
    return selectedDates.length > 0;
  }, [multiple, selectedDates]);

  const formatDateRange = React.useCallback((range: DateRange) => {
    if (!range.from && !range.to) return '';
    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    return formatDate(range.from ?? range.to);
  }, []);

  const label = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return null;

      const hasSelectedDates = selectedDates.from || selectedDates.to;
      const dateText = hasSelectedDates
        ? formatDateRange(selectedDates)
        : i18n.dateFilter.selectDateRange;

      return (
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {hasSelectedDates && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <span>{dateText}</span>
            </>
          )}
        </span>
      );
    }

    if (getIsDateRange(selectedDates)) return null;

    const hasSelectedDate = selectedDates.length > 0;
    const dateText = hasSelectedDate ? formatDate(selectedDates[0]) : i18n.dateFilter.selectDate;

    return (
      <span className="flex items-center gap-2">
        <span>{title}</span>
        {hasSelectedDate && (
          <>
            <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
            <span>{dateText}</span>
          </>
        )}
      </span>
    );
  }, [selectedDates, multiple, formatDateRange, title]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('border-dashed font-normal h-8 justify-start', className)}
        >
          {hasValue ? (
            <div
              role="button"
              aria-label={i18n.dateFilter.clearFilterAria}
              tabIndex={0}
              onClick={onReset}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <XCircle />
            </div>
          ) : (
            <CalendarIcon />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {multiple ? (
          <Calendar
            autoFocus
            captionLayout="dropdown"
            mode="range"
            selected={
              getIsDateRange(activeDates) ? activeDates : { from: undefined, to: undefined }
            }
            onSelect={handleSelect}
          />
        ) : (
          <Calendar
            captionLayout="dropdown"
            mode="single"
            selected={!getIsDateRange(activeDates) ? activeDates[0] : undefined}
            onSelect={handleSelect}
          />
        )}
        {multiple && applyButton && (
          <div className="border-t p-2">
            <Button size="sm" className="w-full" onClick={handleApply}>
              {i18n.dateFilter.apply}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
