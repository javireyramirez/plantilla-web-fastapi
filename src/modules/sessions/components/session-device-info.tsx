import { Laptop, Monitor, Smartphone, Tablet } from 'lucide-react';
import * as React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { parseUserAgent } from '../model/sessions.types';

interface SessionDeviceInfoProps {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export function SessionDeviceInfo({ userAgent, ipAddress }: SessionDeviceInfoProps) {
  const info = React.useMemo(() => parseUserAgent(userAgent), [userAgent]);

  const Icon = React.useMemo(() => {
    switch (info.deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
        return Monitor;
      default:
        return Laptop;
    }
  }, [info.deviceType]);

  const displayName = `${info.browser} · ${info.os}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 max-w-[240px] cursor-help">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-md p-3 text-xs space-y-1.5">
        <div className="font-semibold text-foreground">Información del dispositivo</div>
        <div>
          <span className="text-muted-foreground">Navegador: </span>
          <span className="font-medium text-foreground">{info.browser}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Sistema operativo: </span>
          <span className="font-medium text-foreground">{info.os}</span>
        </div>
        {ipAddress && (
          <div>
            <span className="text-muted-foreground">Dirección IP: </span>
            <span className="font-mono text-foreground">{ipAddress}</span>
          </div>
        )}
        {info.raw && (
          <div className="pt-1 border-t border-border">
            <span className="text-muted-foreground block mb-0.5">User Agent:</span>
            <span className="font-mono text-[11px] text-muted-foreground break-all leading-relaxed">
              {info.raw}
            </span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
