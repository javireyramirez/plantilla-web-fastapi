import { ChevronDown, Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExportFormats } from '@/hooks/use-export-formats';
import { cn } from '@/lib/utils';

export interface ExportHandler {
  handleExport: (format: string, asyncJob?: boolean) => void;
  isPending: boolean;
  totalRows?: number;
}

export interface ExportDropdownProps {
  /** Resource/entity path used by backend to fetch supported formats (SSOT) */
  entityName?: string;
  /** Explicit formats override (if provided, skips backend query) */
  formats?: string[];
  /** Force asynchronous background execution (?async_job=true) */
  asyncJob?: boolean;
  /** Callback triggered when a format is selected */
  onExport?: (format: string, asyncJob?: boolean) => Promise<void> | void;
  /** Export handler provided by table hook */
  handler?: ExportHandler | null;
  /** Loading state indicator */
  isPending?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom button label */
  label?: string;
  /** Button style variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Custom CSS classes */
  className?: string;
  /** Dropdown menu alignment */
  align?: 'start' | 'center' | 'end';
  /** Display only the icon without text */
  iconOnly?: boolean;
}

export function ExportDropdown({
  entityName,
  formats: formatsProp,
  asyncJob,
  onExport,
  handler,
  isPending: isPendingProp,
  disabled: disabledProp,
  label,
  variant = 'outline',
  size = 'sm',
  className,
  align = 'end',
  iconOnly = false,
}: ExportDropdownProps) {
  const { t } = useTranslation();
  const [isLocalPending, setIsLocalPending] = React.useState(false);
  const { data: remoteFormats, isLoading: isLoadingFormats } = useExportFormats(
    formatsProp ? undefined : entityName
  );

  const availableFormats = formatsProp || remoteFormats || [];
  const isPending = isPendingProp ?? (isLocalPending || (handler?.isPending ?? false));
  const isNoData = handler?.totalRows !== undefined && handler.totalRows === 0;
  const isDisabled = disabledProp || isPending || isNoData;

  const handleSelectFormat = async (format: string) => {
    if (isDisabled) return;
    try {
      if (onExport) {
        const result = onExport(format, asyncJob);
        if (result && typeof (result as any).then === 'function') {
          setIsLocalPending(true);
          await result;
        }
      } else if (handler?.handleExport) {
        handler.handleExport(format, asyncJob);
      }
    } finally {
      setIsLocalPending(false);
    }
  };

  const buttonText = isPending
    ? t('export.exporting', { defaultValue: 'Exportando...' })
    : (label ?? t('export.button', { defaultValue: 'Exportar' }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className={cn('gap-2 shadow-sm font-medium', className)}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {!iconOnly && <span>{buttonText}</span>}
          {!iconOnly && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[170px]">
        {isLoadingFormats && availableFormats.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{t('export.exporting', { defaultValue: 'Cargando...' })}</span>
          </div>
        ) : availableFormats.length > 0 ? (
          availableFormats.map((fmt) => (
            <DropdownMenuItem
              key={fmt}
              onClick={() => handleSelectFormat(fmt)}
              className="cursor-pointer text-xs sm:text-sm py-1.5"
            >
              {t(`export.formats.${fmt}`, { defaultValue: fmt.toUpperCase() })}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-2 text-xs text-muted-foreground text-center">
            {t('export.noFormats', { defaultValue: 'Sin formatos disponibles' })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ExportDropdownMenuSubProps {
  entityName?: string;
  formats?: string[];
  asyncJob?: boolean;
  onExport?: (format: string, asyncJob?: boolean) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

export function ExportDropdownMenuSub({
  entityName,
  formats: formatsProp,
  asyncJob,
  onExport,
  disabled = false,
  className,
}: ExportDropdownMenuSubProps) {
  const { t } = useTranslation();
  const { data: remoteFormats, isLoading } = useExportFormats(
    formatsProp ? undefined : entityName
  );
  const availableFormats = formatsProp || remoteFormats || [];

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled} className={cn('gap-2', className)}>
        <Download className="h-4 w-4" />
        <span>{t('export.button', { defaultValue: 'Exportar' })}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {isLoading && availableFormats.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{t('export.exporting', { defaultValue: 'Cargando...' })}</span>
          </div>
        ) : availableFormats.length > 0 ? (
          availableFormats.map((fmt) => (
            <DropdownMenuItem
              key={fmt}
              onClick={() => onExport?.(fmt, asyncJob)}
              className="cursor-pointer text-xs sm:text-sm py-1.5"
            >
              {t(`export.formats.${fmt}`, { defaultValue: fmt.toUpperCase() })}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-2 text-xs text-muted-foreground text-center">
            {t('export.noFormats', { defaultValue: 'Sin formatos disponibles' })}
          </div>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
