import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { EntitiesTrashTable } from '../components/entities-trash-table';
import { DocumentsTrashTable } from '../components/documents-trash-table';

export default function RecoveryView() {
  const { t } = useTranslation();
  const location = useLocation();
  const isDocuments = location.pathname.includes('/documents');

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {isDocuments ? t('sidebar.nav.documents') : t('trash.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDocuments ? t('trash.subtitleDocuments') : t('trash.subtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        {isDocuments ? <DocumentsTrashTable /> : <EntitiesTrashTable />}
      </div>
    </div>
  );
}
