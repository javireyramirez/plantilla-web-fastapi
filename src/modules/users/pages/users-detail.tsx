import {
  // Símbolo de candado
  ArrowLeft,
  Ban,
  Building2,
  ChevronDown,
  Download,
  LoaderCircle,
  Lock,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  User,
  UserCheck,
} from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect, useState } from 'react';

import { FormSkeleton } from '@/components/skeleton/form-skeleton';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTable } from '@/modules/audit/components/audit-table';
import { SessionsTable } from '@/modules/sessions/components/sessions-table';
import { usersQueries } from '@/modules/users/model/users.query';

import { ExportDropdown, ExportDropdownMenuSub } from '@/components/export-dropdown';
import { RefreshButton } from '@/components/refresh-button';
import { useSession } from '@/config/auth-client';
import { useImpersonateUser } from '@/hooks/use-auth';
import usePermissions from '@/hooks/use-permissions';

import { UsersDetailForm } from '../components/users-form';
import { UserRolesTable } from '../components/users-roles-table';
import { UsersTeamsTable } from '../components/users-teams-table';
import { useUsersForm } from '../model/use-users-detail';

export default function UsersDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const impersonateMutation = useImpersonateUser();
  const { can, isSuperAdmin } = usePermissions();
  const canExport = can('users', 'EXPORT');
  const canDelete = can('users', 'DELETE');
  const canCreate = can('users', 'CREATE');
  const canUpdate = can('users', 'UPDATE');
  // --- Estados locales ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  // --- Hooks de datos y formulario ---
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    setActiveTab('detail');
  }, [id]);

  // Extraemos las nuevas propiedades y funciones desde tu hook
  const {
    data,
    isEditing,
    userName,
    isActive,
    isLoading,
    isFetching,
    refetch,
    form,
    handleSubmit,
    handleDelete,
    handleSuspend,
    handleUnSuspend,
    handleResendInvitation,
    handleExport,
    isPending,
  } = useUsersForm(id);

  const isTrashed = (data as any)?.status === 'TRASHED';
  const canImpersonate = isSuperAdmin && isEditing && !!id && id !== session?.user?.id && isActive && !isTrashed;
  const canSave = isEditing ? can('users', 'UPDATE') : can('users', 'CREATE');
  const canReadAudit = isSuperAdmin || can('audit', 'READ');
  const canReadSessions = isSuperAdmin || can('sessions', 'READ');

  const { mutate: restore, isPending: isRestoring } = usersQueries.useRestore();

  const handleRestore = () => {
    if (!id) return;
    restore(id, {
      onSuccess: () => {
        toast.success(t('trash.toast.restoreSuccess') || 'Usuario restaurado con éxito');
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(
          serverMessage || t('trash.toast.restoreError') || 'Error al restaurar el usuario'
        );
      },
    });
  };

  

  const tabs = [
    { value: 'detail', label: t('users.tabs.detail'), visible: true },
    { value: 'teams', label: t('users.tabs.teams'), visible: isEditing },
    { value: 'roles', label: t('users.tabs.roles'), visible: isEditing },
    { value: 'sessions', label: t('users.tabs.sessions', { defaultValue: 'Sesiones' }), visible: isEditing && canReadSessions },
    { value: 'audit', label: t('users.tabs.audit'), visible: isEditing && canReadAudit },
  ].filter((tab) => tab.visible);

  const currentTab = tabs.find((tab) => tab.value === activeTab) || tabs[0];

  // --- Estado de Carga (Skeletons) ---
  if (isLoading) return <FormSkeleton />;

  // --- Renderizado Principal ---
  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/admin/users">{t('users.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground flex items-center gap-1.5">
                {/* Candado en el Breadcrumb si está inactivo */}
                {isEditing && !isActive && <Lock className="h-3.5 w-3.5 text-destructive" />}
                {isEditing ? `${userName}` : t('users.createTitle')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isEditing && (
            <RefreshButton onClick={refetch} isFetching={isFetching} />
          )}
        </div>
      </div>

      {/* SECCIÓN: Barra de Acciones Adaptativa Global */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 shrink-0"
            aria-label={t('common.back', { defaultValue: 'Volver' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground shrink-0" />
              {isEditing ? (
                <span className="truncate flex items-center gap-2">
                  <span className="text-primary">{userName}</span>
                  {/* Candado / Tag indicador visual al lado del nombre principal */}
                  {isTrashed ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      <Trash2 className="h-3 w-3" />
                      {t('trash.table.expired') || 'Eliminado'}
                    </span>
                  ) : !isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      <Lock className="h-3 w-3" />
                      {t('users.statusName.suspended')}
                    </span>
                  ) : null}
                </span>
              ) : (
                t('users.createTitle')
              )}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {isEditing ? t('users.editDescription') : t('users.createDescription')}
            </p>
          </div>
        </div>

        {/* Contenedor Único de Botones (con flex-wrap para pantallas intermedias) */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
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
                  {/* Ocultos en tablets/portátiles (< lg), visibles en pantallas grandes */}
                  {canUpdate && (
                    <>
                      {canImpersonate && (
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden lg:flex border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white gap-2"
                          disabled={isPending || impersonateMutation.isPending}
                          onClick={() => setImpersonateDialogOpen(true)}
                        >
                          <UserCheck className="h-4 w-4" />
                          {t('impersonate.actionButton', { defaultValue: 'Impersonar' })}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        className="hidden lg:flex gap-2"
                        disabled={isPending}
                        onClick={handleResendInvitation}
                      >
                        <Send className="h-4 w-4" />
                        {t('users.resendInvitation')}
                      </Button>

                      {isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden lg:flex border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white gap-2"
                          disabled={isPending}
                          onClick={handleSuspend}
                        >
                          <Ban className="h-4 w-4" />
                          {t('users.suspend')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden lg:flex border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white gap-2"
                          disabled={isPending}
                          onClick={handleUnSuspend}
                        >
                          <UserCheck className="h-4 w-4" />
                          {t('users.unsuspend')}
                        </Button>
                      )}
                    </>
                  )}

                  {canExport && (
                    <ExportDropdown
                      entityName="users"
                      onExport={handleExport}
                      disabled={isPending}
                      className="hidden lg:flex"
                    />
                  )}

                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      className="hidden lg:flex border-destructive text-destructive hover:bg-destructive hover:text-white gap-2"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('users.delete')}
                    </Button>
                  )}

                  {/* Solo visible en pantallas muy grandes (xl) */}
                  {canCreate && (
                    <Button
                      type="button"
                      variant="outline"
                      className="hidden xl:flex gap-2"
                      disabled={isPending}
                      asChild
                    >
                      <Link to="/admin/users/new" onClick={() => setActiveTab('detail')}>
                        <Plus className="h-4 w-4" />
                        {t('users.new')}
                      </Link>
                    </Button>
                  )}
                </>
              )}

              {canSave && (
                <>
                  {/* Botón Guardar y Cerrar: Visible a partir de tablets (md) */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || (isEditing && !isActive)}
                    onClick={() =>
                      form.handleSubmit((data) => handleSubmit(data, { shouldClose: true }))()
                    }
                    className="hidden md:flex gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {t('users.saveAndClose')}
                  </Button>

                  {/* Acción Principal: Siempre visible en barra principal */}
                  <Button
                    type="button"
                    disabled={isPending || (isEditing && !isActive)}
                    onClick={() => form.handleSubmit((data) => handleSubmit(data))()}
                    className="gap-2 shadow-sm flex-1 sm:flex-none justify-center"
                  >
                    <Save className="h-4 w-4" />
                    {t('users.save')}
                  </Button>
                </>
              )}

              {/* Menú Desplegable Adaptativo Móvil / Tablet / Portátil */}
              {((canSave) || (isEditing && (canExport || canCreate || canDelete || canUpdate))) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`px-3 ${isEditing ? 'xl:hidden' : 'md:hidden'}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    {/* Aparece aquí en móviles (< md) */}
                    {canSave && (
                      <DropdownMenuItem
                        disabled={isPending || (isEditing && !isActive)}
                        className="md:hidden gap-2"
                        onSelect={(e) => {
                          e.preventDefault();
                          form.handleSubmit((data) => handleSubmit(data, { shouldClose: true }))();
                        }}
                      >
                        <Save className="h-4 w-4" />
                        {t('users.saveAndClose')}
                      </DropdownMenuItem>
                    )}

                    {isEditing && (
                      <>
                        {/* Aparecen aquí si la pantalla es menor que LG (portátiles pequeños/tablets) */}
                        {canUpdate && (
                          <>
                            {canImpersonate && (
                              <DropdownMenuItem
                                disabled={isPending || impersonateMutation.isPending}
                                className="lg:hidden gap-2 text-indigo-600 focus:text-indigo-700 font-medium"
                                onSelect={() => setImpersonateDialogOpen(true)}
                              >
                                <UserCheck className="h-4 w-4" />
                                {t('impersonate.actionButton', { defaultValue: 'Impersonar' })}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              disabled={isPending}
                              className="lg:hidden gap-2"
                              onSelect={handleResendInvitation}
                            >
                              <Send className="h-4 w-4" />
                              {t('users.resendInvitation')}
                            </DropdownMenuItem>

                            {isActive ? (
                              <DropdownMenuItem
                                disabled={isPending}
                                className="lg:hidden gap-2 text-amber-600 focus:text-amber-700"
                                onSelect={handleSuspend}
                              >
                                <Ban className="h-4 w-4" />
                                {t('users.suspend')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={isPending}
                                className="lg:hidden gap-2 text-emerald-600 focus:text-emerald-700"
                                onSelect={handleUnSuspend}
                              >
                                <UserCheck className="h-4 w-4" />
                                {t('users.unsuspend')}
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        {canExport && (
                          <ExportDropdownMenuSub
                            entityName="users"
                            onExport={handleExport}
                            disabled={isPending}
                            className="lg:hidden"
                          />
                        )}

                        {/* Se muestra en el menú si la pantalla es menor a xl */}
                        {canCreate && (
                          <DropdownMenuItem disabled={isPending} className="xl:hidden gap-2" asChild>
                            <Link to="/admin/users/new" onClick={() => setActiveTab('detail')}>
                              <Plus className="h-4 w-4" />
                              {t('users.new')}
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {canDelete && (
                          <DropdownMenuItem
                            disabled={isPending}
                            className="lg:hidden gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            onSelect={(e) => {
                              e.preventDefault();
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            {t('users.delete')}
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
          <div className={isTrashed ? 'pointer-events-none select-none opacity-70' : ''}>
            <FormProvider {...form}>
              <UsersDetailForm isEditing={isEditing} isActive={isActive && !isTrashed} />
            </FormProvider>
          </div>
        </TabsContent>

        {isEditing && (
          <>
            <TabsContent value="teams" className="outline-none">
              <UsersTeamsTable userId={id!} />
            </TabsContent>

            <TabsContent value="roles" className="outline-none">
              <UserRolesTable userId={id!} />
            </TabsContent>

            {canReadSessions && (
              <TabsContent value="sessions" className="outline-none">
                <SessionsTable userId={id!} />
              </TabsContent>
            )}

            {canReadAudit && (
              <TabsContent value="audit" className="outline-none">
                <AuditTable moduleSlug="users" entityId={id} />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>

      {/* SECCIÓN: Dialogo de Confirmación de Borrado */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('users.deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t('users.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} variant="destructive">
              {t('users.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SECCIÓN: Dialogo de Confirmación de Impersonación */}
      <AlertDialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-indigo-600">
              <UserCheck className="h-5 w-5" />
              {t('impersonate.dialogTitle', { defaultValue: 'Impersonar Usuario' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('impersonate.dialogDescription', {
                defaultValue: `¿Estás seguro de que deseas iniciar sesión como ${userName}? Actuarás temporalmente con su cuenta y permisos. Podrás salir de la suplantación en cualquier momento desde la barra superior.`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonateMutation.isPending}>
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={impersonateMutation.isPending}
              onClick={() => {
                if (!id) return;
                impersonateMutation.mutate(id, {
                  onSuccess: () => {
                    setImpersonateDialogOpen(false);
                  },
                });
              }}
            >
              {impersonateMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('impersonate.starting', { defaultValue: 'Iniciando...' })}
                </>
              ) : (
                t('impersonate.confirmButton', { defaultValue: 'Iniciar Impersonación' })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
