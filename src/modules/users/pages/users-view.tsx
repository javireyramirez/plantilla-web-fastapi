import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import * as React from 'react';

import { ExportDropdown } from '@/components/export-dropdown';
import { Button } from '@/components/ui/button';
import usePermissions from '@/hooks/use-permissions';

import { UsersTable } from '../components/users-table';

export default function UsersView() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canCreate = can('users', 'CREATE');
  const canExport = can('users', 'EXPORT');

  const exportRef = React.useRef<((format: string, asyncJob?: boolean) => Promise<void> | void) | null>(null);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('users.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('users.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {canExport && (
            <ExportDropdown
              entityName="users"
              onExport={(format, asyncJob) => exportRef.current?.(format, asyncJob)}
              variant="outline"
              size="sm"
            />
          )}
          {canCreate && (
            <Button asChild size="sm" className="gap-2 shadow-sm flex-1 sm:flex-none justify-center">
              <Link to="/admin/users/new">
                <Plus className="h-4 w-4" />
                {t('users.new')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <UsersTable exportRef={exportRef} />
      </div>
    </div>
  );
}
