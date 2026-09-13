import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import usePermissions from '@/hooks/use-permissions';

import { CompaniesTable } from '../components/companies-table';

export default function CompaniesView() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canCreate = can('companies', 'CREATE');

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('companies.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('companies.subtitle')}</p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button asChild size="sm" className="gap-2 shadow-sm flex-1 sm:flex-none justify-center">
              <Link to="/companies/new">
                <Plus className="h-4 w-4" />
                {t('companies.new')}
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <CompaniesTable />
      </div>
    </div>
  );
}
