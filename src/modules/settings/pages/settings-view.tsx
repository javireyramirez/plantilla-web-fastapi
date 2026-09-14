import { Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SettingsTable } from '../components/settings-table';

export default function SettingsView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            {t('settings.title', { defaultValue: 'Configuración' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('settings.subtitle', {
              defaultValue: 'Configuración dinámica del sistema, parámetros de almacenamiento y feature flags.',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <SettingsTable />
      </div>
    </div>
  );
}
