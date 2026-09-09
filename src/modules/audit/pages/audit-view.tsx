import { useTranslation } from 'react-i18next';

import { AuditTable } from '../components/audit-table';

export default function AuditView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('audit.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('audit.subtitle')}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6">
          <AuditTable />
        </div>
      </div>
    </div>
  );
}
