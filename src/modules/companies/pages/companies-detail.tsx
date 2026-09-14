import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Download,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentsTable, FileUploadButton } from '@/features/storage';
import { AuditTable } from '@/modules/audit/components/audit-table';
import { companiesQueries } from '@/modules/companies/model/companies.query';
import { useCompanyForm } from '@/modules/companies/model/use-companies-detail';

import { ExportDropdown, ExportDropdownMenuSub } from '@/components/export-dropdown';
import usePermissions from '@/hooks/use-permissions';

import { CompaniesDetailForm } from '../components/companies-form';
import { SECTOR_OPTIONS } from '../model/companies.types';

export default function CompanyDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canExport = can('companies', 'EXPORT');

  // --- Estados locales ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  // --- Hooks de datos y formulario ---
  const { id } = useParams<{ id: string }>();
  const { data, isEditing, companyName, isLoading, form, handleSubmit, handleDelete, handleExport, isPending } =
    useCompanyForm(id);

  const { mutate: restore, isPending: isRestoring } = companiesQueries.useRestore();

  const handleRestore = () => {
    if (!id) return;
    restore(id, {
      onSuccess: () => {
        toast.success(t('trash.toast.restoreSuccess') || 'Restaurado con éxito');
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('trash.toast.restoreError') || 'Error al restaurar');
      },
    });
  };

  const isTrashed = data?.status === 'TRASHED';

  const tabs = [
    { value: 'detail', label: t('companies.tabs.detail'), viewAtCreate: true },
    { value: 'docs', label: t('companies.tabs.docs'), viewAtCreate: isEditing },
    { value: 'audit', label: t('companies.tabs.audit'), viewAtCreate: isEditing },
  ];

  const currentTab = tabs.find((tab) => tab.value === activeTab);

  // --- Estado de Carga (Skeletons) ---
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
            <Skeleton className="h-10 w-10 sm:w-24 hidden sm:block" />
          </div>
        </div>

        <div className="border-b pb-2 flex gap-6">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Renderizado Principal ---
  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/companies">{t('companies.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                {isEditing ? `${companyName}` : t('companies.createTitle')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate(-1)} variant="outline" className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('audit.back')}
        </Button>
      </div>

      {/* SECCIÓN: Barra de Acciones Adaptativa Global */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-primary">{companyName}</span>
              </div>
            ) : (
              t('companies.createTitle')
            )}
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {isEditing ? t('companies.editDescription') : t('companies.createDescription')}
          </p>
        </div>

        {/* Contenedor Único de Botones (Control de responsividad fluido) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isTrashed ? (
            <Button
              type="button"
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white gap-2"
              disabled={isPending || isRestoring}
              onClick={handleRestore}
            >
              <RotateCcw className="h-4 w-4" />
              {t('trash.actions.restoreSelected') || 'Restaurar'}
            </Button>
          ) : (
            <>
              {isEditing && (
                <>
                  {/* Exportar y Eliminar: Visibles a partir de pantallas grandes (lg) */}
                  {canExport && (
                    <ExportDropdown
                      entityName="companies"
                      onExport={handleExport}
                      disabled={isPending}
                      className="hidden lg:flex"
                    />
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="hidden lg:flex border-destructive text-destructive hover:bg-destructive hover:text-white gap-2"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('companies.delete')}
                  </Button>

                  {/* Nueva Compañía: Visible solo en pantallas muy grandes (xl) */}
                  <Button
                    type="button"
                    variant="outline"
                    className="hidden xl:flex gap-2"
                    disabled={isPending}
                    asChild
                  >
                    <Link to="/companies/new">
                      <Plus className="h-4 w-4" />
                      {t('companies.new')}
                    </Link>
                  </Button>
                </>
              )}

              {/* Botón Guardar y Cerrar: Visible a partir de pantallas medianas (md) */}
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  form.handleSubmit((data) => handleSubmit(data, { shouldClose: true }))()
                }
                className="hidden md:flex gap-2"
              >
                <Save className="h-4 w-4" />
                {t('companies.saveAndClose')}
              </Button>

              {/* Acción Principal: Siempre visible */}
              <Button
                type="button"
                disabled={isPending}
                onClick={() => form.handleSubmit((data) => handleSubmit(data))()}
                className="gap-2 shadow-sm flex-1 sm:flex-none justify-center"
              >
                <Save className="h-4 w-4" />
                {t('companies.save')}
              </Button>

              {/* Menú Desplegable Adaptativo: Captura los botones que desaparecen según el breakpoint */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`px-3 ${isEditing ? 'xl:hidden' : 'md:hidden'}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  {/* Se muestra en el menú si la pantalla es menor a md */}
                  <DropdownMenuItem
                    disabled={isPending}
                    className="md:hidden gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      form.handleSubmit((data) => handleSubmit(data, { shouldClose: true }))();
                    }}
                  >
                    <Save className="h-4 w-4" />
                    {t('companies.saveAndClose')}
                  </DropdownMenuItem>

                  {isEditing && (
                    <>
                      {canExport && (
                        <ExportDropdownMenuSub
                          entityName="companies"
                          onExport={handleExport}
                          disabled={isPending}
                          className="lg:hidden"
                        />
                      )}

                      {/* Se muestra en el menú si la pantalla es menor a xl */}
                      <DropdownMenuItem disabled={isPending} className="xl:hidden gap-2" asChild>
                        <Link to="/companies/new">
                          <Download className="h-4 w-4" />
                          {t('companies.new')}
                        </Link>
                      </DropdownMenuItem>

                      {/* Se muestra en el menú si la pantalla es menor a lg */}
                      <DropdownMenuItem
                        disabled={isPending}
                        className="lg:hidden gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                        onSelect={(e) => {
                          e.preventDefault();
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        {t('companies.delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* SECCIÓN: Navegación por Pestañas (Tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Vista Escritorio */}
        <TabsList
          variant="line"
          className="hidden md:flex h-auto w-fit justify-start gap-6 rounded-none border-b bg-transparent p-0"
        >
          {tabs
            .filter((t) => t.viewAtCreate === true)
            .map((tab) => (
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
          <div className={isTrashed ? 'pointer-events-none select-none opacity-70' : ''}>
            <FormProvider {...form}>
              <CompaniesDetailForm isEditing={isEditing} company={data} />
            </FormProvider>
          </div>
        </TabsContent>

        {isEditing && (
          <>
            <TabsContent
              value="docs"
              className="outline-none rounded-xl border bg-card p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{t('companies.docsTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('companies.docsDescription')}</p>
                </div>
                <FileUploadButton entityType="companies" entityId={id!} />
              </div>
              <DocumentsTable entityType="companies" entityId={id!} />
            </TabsContent>

            <TabsContent value="audit" className="outline-none">
              <AuditTable moduleSlug="companies" entityId={id} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* SECCIÓN: Diálogo de Confirmación de Borrado Único (Centralizado) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('companies.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('companies.deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t('companies.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} variant="destructive">
              {t('companies.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
