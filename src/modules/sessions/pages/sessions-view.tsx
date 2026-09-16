import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ExportDropdown } from '@/components/export-dropdown';
import usePermissions from '@/hooks/use-permissions';

import { SessionsTable } from '../components/sessions-table';

export default function SessionsView() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canExport = can('sessions', 'EXPORT');
  const exportRef = React.useRef<((format: string) => Promise<void> | void) | null>(null);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('sessions.title', { defaultValue: 'Sesiones' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('sessions.subtitle', {
              defaultValue: 'Control, auditoría y gestión de sesiones y dispositivos de usuario.',
            })}
          </p>
        </div>

        {canExport && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ExportDropdown
              entityName="sessions"
              onExport={(format) => exportRef.current?.(format)}
              variant="outline"
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6">
          <SessionsTable exportRef={exportRef} />
        </div>
      </div>
    </div>
  );
}
