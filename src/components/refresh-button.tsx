import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RefreshButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void | Promise<unknown>;
  isFetching?: boolean;
}

export function RefreshButton({
  onClick,
  isFetching = false,
  className,
  size = 'sm',
  variant = 'outline',
  ...props
}: RefreshButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => onClick()}
      disabled={isFetching || props.disabled}
      className={cn('gap-1.5 shadow-sm', className)}
      {...props}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
      <span>{t('common.refresh', { defaultValue: 'Actualizar' })}</span>
    </Button>
  );
}
