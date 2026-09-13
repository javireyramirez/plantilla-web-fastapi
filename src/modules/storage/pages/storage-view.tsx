import { useTranslation } from 'react-i18next';

import { DocumentsTable } from '@/features/storage';

export default function StorageView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('modules.names.storage', { defaultValue: 'Almacenamiento y Documentos' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('companies.docsDescription', { defaultValue: 'Gestión de archivos y documentos del sistema.' })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <DocumentsTable />
      </div>
    </div>
  );
}
