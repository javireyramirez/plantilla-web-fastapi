import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DocumentsTrashTable } from '../components/documents-trash-table';
import { EntitiesTrashTable } from '../components/entities-trash-table';

export default function RecoveryView() {
  const { t } = useTranslation();
  const location = useLocation();
  const initialTab = location.pathname.includes('/documents') ? 'storage' : 'entities';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('trash.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'storage' ? t('trash.subtitleStorage') : t('trash.subtitle')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="entities">{t('trash.tabs.entities')}</TabsTrigger>
          <TabsTrigger value="storage">{t('trash.tabs.storage')}</TabsTrigger>
        </TabsList>

        <div className="rounded-xl border bg-card shadow-sm p-6">
          <TabsContent value="entities" className="m-0 focus-visible:outline-none">
            <EntitiesTrashTable />
          </TabsContent>
          <TabsContent value="storage" className="m-0 focus-visible:outline-none">
            <DocumentsTrashTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

