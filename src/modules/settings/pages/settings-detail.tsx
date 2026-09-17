import {
  ArrowLeft,
  ChevronDown,
  MoreHorizontal,
  Save,
  Sliders,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useState } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTable } from '@/modules/audit/components/audit-table';
import usePermissions from '@/hooks/use-permissions';

import { SettingsForm } from '../components/settings-form';
import { useSettingsDetail } from '../model/use-settings-detail';
import { RefreshButton } from '@/components/refresh-button';

export default function SettingsDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canReadAudit = can('audit', 'READ');
  const { key } = useParams<{ key: string }>();
  const decodedKey = key ? decodeURIComponent(key) : '';

  const [activeTab, setActiveTab] = useState('detail');

  const {
    setting,
    isLoading,
    isFetching,
    refetch,
    isError,
    isSaving,
    description,
    setDescription,
    valueType,
    stringValue,
    setStringValue,
    boolValue,
    setBoolValue,
    numValue,
    setNumValue,
    jsonValue,
    setJsonValue,
    handleSave,
    isSuperAdmin,
  } = useSettingsDetail(decodedKey);

  const tabs = [
    { value: 'detail', label: t('settings.tabs.detail', { defaultValue: 'Detalle' }), visible: true },
    { value: 'audit', label: t('settings.tabs.audit', { defaultValue: 'Auditoría' }), visible: canReadAudit },
  ].filter((tab) => tab.visible);

  const currentTab = tabs.find((tab) => tab.value === activeTab) || tabs[0];

  // --- Estado de Carga (Skeletons idénticos a CompanyDetail) ---
  if (isLoading) {
    return (
      <div className="space-y-6 mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-64 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 flex-1 sm:flex-none sm:w-28" />
            <Skeleton className="h-10 w-10 sm:w-24 hidden sm:block" />
          </div>
        </div>

        <div className="border-b pb-2 flex gap-6">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Estado de Error / No Encontrado ---
  if (isError || !setting) {
    return (
      <div className="space-y-6 mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/settings')} variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t('common.back', { defaultValue: 'Volver' })}
          </Button>
        </div>
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-destructive">
            {t('settings.notFound', { defaultValue: 'Configuración no encontrada.' })}
          </p>
          <Button variant="outline" onClick={() => navigate('/admin/settings')}>
            {t('settings.backToList', { defaultValue: 'Volver a configuraciones' })}
          </Button>
        </div>
      </div>
    );
  }

  // --- Renderizado Principal (Espejo de CompanyDetail) ---
  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/admin/settings">{t('settings.title', { defaultValue: 'Configuración' })}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-mono text-sm font-medium text-foreground">
                {decodedKey}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <RefreshButton onClick={refetch} isFetching={isFetching} />
          <Button onClick={() => navigate('/admin/settings')} variant="outline" size="sm" className="w-full sm:w-auto shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', { defaultValue: 'Volver' })}
          </Button>
        </div>
      </div>

      {/* SECCIÓN: Barra de Acciones Adaptativa Global */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-primary font-mono">{decodedKey}</span>
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {t('settings.editDescription', {
              defaultValue: 'Modifica el valor y metadatos de esta configuración del sistema.',
            })}
          </p>
        </div>

        {/* Contenedor Único de Botones (Guardar y Cerrar / Guardar) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Botón Guardar y Cerrar: Visible a partir de pantallas medianas (md) */}
          <Button
            type="button"
            variant="outline"
            disabled={isSaving || !isSuperAdmin}
            onClick={() => handleSave({ shouldClose: true })}
            className="hidden md:flex gap-2"
          >
            <Save className="h-4 w-4" />
            {t('common.saveAndClose', { defaultValue: 'Guardar y cerrar' })}
          </Button>

          {/* Acción Principal: Siempre visible */}
          <Button
            type="button"
            disabled={isSaving || !isSuperAdmin}
            onClick={() => handleSave({ shouldClose: false })}
            className="gap-2 shadow-sm flex-1 sm:flex-none justify-center"
          >
            <Save className="h-4 w-4" />
            {t('common.save', { defaultValue: 'Guardar' })}
          </Button>

          {/* Menú Desplegable Adaptativo Móvil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="px-3 md:hidden" disabled={isSaving || !isSuperAdmin}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled={isSaving || !isSuperAdmin}
                className="gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  handleSave({ shouldClose: true });
                }}
              >
                <Save className="h-4 w-4" />
                {t('common.saveAndClose', { defaultValue: 'Guardar y cerrar' })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SECCIÓN: Navegación por Pestañas (Tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Vista Escritorio */}
        <TabsList
          variant="line"
          className="hidden md:flex h-auto w-fit justify-start gap-6 rounded-none border-b bg-transparent p-0"
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-0 w-32 shrink-0">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Vista Móvil */}
        <div className="border-b md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-0 text-base font-medium">
                {currentTab?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {tabs.map((tab) => (
                <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)}>
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}
        <TabsContent value="detail" className="outline-none">
          <SettingsForm
            setting={setting}
            description={description}
            setDescription={setDescription}
            valueType={valueType}
            stringValue={stringValue}
            setStringValue={setStringValue}
            boolValue={boolValue}
            setBoolValue={setBoolValue}
            numValue={numValue}
            setNumValue={setNumValue}
            jsonValue={jsonValue}
            setJsonValue={setJsonValue}
            isSuperAdmin={isSuperAdmin}
            isSaving={isSaving}
          />
        </TabsContent>

        {canReadAudit && (
          <TabsContent value="audit" className="outline-none">
            {setting?.id ? (
              <AuditTable moduleSlug="settings" entityId={setting.id} />
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t('common.loading', { defaultValue: 'Cargando...' })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
