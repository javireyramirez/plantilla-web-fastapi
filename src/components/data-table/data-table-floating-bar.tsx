import { MoreHorizontal, X } from 'lucide-react';

import * as React from 'react';

import { type Row, type Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface FloatingBarAction<TData> {
  label: string;
  icon: React.ReactNode;
  onClick: (rows: Row<TData>[]) => void;
  variant?: 'ghost' | 'destructive';
  disabled?: boolean;
  className?: string;
  hideOnMobile?: boolean;
}
export interface DataTableFloatingBarProps<TData> {
  table: Table<TData>;
  actions?: FloatingBarAction<TData>[];
}

export function DataTableFloatingBar<TData>({ table, actions }: DataTableFloatingBarProps<TData>) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const isMobile = useIsMobile();

  const filteredActions = actions?.filter((action) => !isMobile || !action.hideOnMobile) ?? [];

  const MAX_VISIBLE = isMobile ? 2 : 4;
  const visibleActions = filteredActions.slice(0, MAX_VISIBLE);
  const overflowActions = filteredActions.slice(MAX_VISIBLE);

  const onClearSelection = React.useCallback(() => {
    table.toggleAllRowsSelected(false);
  }, [table]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClearSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClearSelection]);

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit px-4">
      <div className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg">
        {/* Contador */}
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {rows.length}
          </span>
          {!isMobile && <span className="text-sm text-muted-foreground">Selected</span>}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Acciones visibles */}
        <div className="flex items-center gap-1">
          {visibleActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? 'ghost'}
              size="sm"
              className={cn(isMobile ? 'h-8 w-8 p-0' : 'h-8', action.className)}
              onClick={() => action.onClick(rows)}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon}
              {!isMobile && <span className="ml-2">{action.label}</span>}
            </Button>
          ))}

          {/* Overflow dropdown */}
          {overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {overflowActions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={() => action.onClick(rows)}
                    className={cn(
                      action.variant === 'destructive' ? 'text-destructive' : '',
                      action.className
                    )}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Clear */}
        <div className="flex items-center gap-2 px-1">
          <Button
            variant="ghost"
            size="sm"
            className={isMobile ? 'h-8 w-8 p-0' : 'h-8 px-2'}
            onClick={onClearSelection}
            title="Clear selection"
          >
            <X className={isMobile ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
            {!isMobile && 'Clear'}
          </Button>
          {!isMobile && <Kbd className="text-[10px] uppercase">Esc</Kbd>}
        </div>
      </div>
    </div>
  );
}
