import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import usePermissions from '@/hooks/use-permissions';

import { JobEnqueueDialog } from '../components/job-enqueue-dialog';
import { JobsTable } from '../components/jobs-table';

export default function JobsView() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canCreate = can('jobs', 'CREATE');
  const [enqueueOpen, setEnqueueOpen] = React.useState(false);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('jobs.title', { defaultValue: 'Tareas Asíncronas' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              'jobs.subtitle',
              { defaultValue: 'Monitoreo, trazabilidad y control de tareas asíncronas del sistema.' }
            )}
          </p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button size="sm" onClick={() => setEnqueueOpen(true)} className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>{t('jobs.enqueueButton', { defaultValue: 'Encolar tarea' })}</span>
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6">
          <JobsTable />
        </div>
      </div>

      {canCreate && (
        <JobEnqueueDialog open={enqueueOpen} onOpenChange={setEnqueueOpen} />
      )}
    </div>
  );
}
