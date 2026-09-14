import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import usePermissions from '@/hooks/use-permissions';

import { RolesTable } from '../components/roles-table';

export default function RolesView() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canCreate = can('roles', 'CREATE');

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('roles.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('roles.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {canCreate && (
            <Button asChild size="sm" className="gap-2 shadow-sm flex-1 sm:flex-none justify-center">
              <Link to="/admin/roles/new">
                <Plus className="h-4 w-4" />
                {t('roles.new')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <RolesTable />
      </div>
    </div>
  );
}
