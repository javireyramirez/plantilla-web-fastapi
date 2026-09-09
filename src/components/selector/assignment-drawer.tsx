import { useTranslation } from 'react-i18next';

import * as React from 'react';

import { Selector } from '@/components/selector/selector';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface SelectorConfig {
  key: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  useGetList: (params: any) => { data?: { id: string; name: string }[]; isLoading: boolean };
  excludeIds?: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

interface AssignmentDrawerProps {
  triggerBtnText: string;
  triggerIcon?: React.ReactNode;
  drawerTitle: string;
  drawerDescription?: string;
  selectors: SelectorConfig[];
  onApply: () => void;
  isApplying?: boolean;
  triggerClassName?: string;
}

export function AssignmentDrawer({
  triggerBtnText,
  triggerIcon,
  drawerTitle,
  drawerDescription,
  selectors,
  onApply,
  isApplying,
  triggerClassName,
}: AssignmentDrawerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  // Determine if Apply is disabled: isApplying is true, or all selector selections are empty.
  const isApplyDisabled =
    isApplying || selectors.every((s) => !s.value || s.value.length === 0);

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className={triggerClassName}>
          {triggerIcon && <span className="mr-2">{triggerIcon}</span>}
          {triggerBtnText}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-6 sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{drawerTitle}</SheetTitle>
          {drawerDescription && <SheetDescription>{drawerDescription}</SheetDescription>}
        </SheetHeader>

        {/* Content area: Normal vertical stack with no flex-1 min-h-0 pushing buttons down */}
        <div className="flex flex-col gap-5">
          {selectors.map((config) => (
            <div key={config.key} className="flex flex-col gap-2">
              {config.label && (
                <label className="text-sm font-medium text-foreground">{config.label}</label>
              )}
              <Selector
                multiple
                applyButton={false}
                disabled={isApplying}
                value={config.value}
                onChange={config.onChange}
                excludeIds={config.excludeIds}
                useGetList={config.useGetList}
                placeholder={config.placeholder}
                searchPlaceholder={config.searchPlaceholder}
                emptyMessage={config.emptyMessage}
              />
            </div>
          ))}

          {/* Action buttons appear directly after the dropdowns */}
          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isApplying}>
              {t('teams.cancel', { defaultValue: 'Cancelar' })}
            </Button>
            <Button onClick={handleApply} disabled={isApplyDisabled}>
              {t('dataTable.selector.applyLabel', { defaultValue: 'Aplicar' })}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
