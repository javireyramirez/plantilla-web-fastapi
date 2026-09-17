import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Laptop,
  Loader2,
  ShieldAlert,
  Smartphone,
  Tablet,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { RefreshButton } from '@/components/refresh-button';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import usePermissions from '@/hooks/use-permissions';

import { SessionStatusBadge } from '../components/session-status-badge';
import { parseUserAgent } from '../model/sessions.types';
import { useSessionDetail } from '../model/use-session-detail';

export default function SessionsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();

  const canDelete = can('sessions', 'DELETE');

  const { session, isLoading, isFetching, refetch, handleRevoke, isPendingRevoke } =
    useSessionDetail(id);

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t('common.copied', { defaultValue: 'Copiado al portapapeles' }));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return '-';
    return new Date(dateVal).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
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
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-card text-center gap-4 my-8">
        <Info className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">
          {t('sessions.notFoundTitle', { defaultValue: 'Sesión no encontrada' })}
        </h2>
        <p className="text-muted-foreground">
          {t('sessions.notFoundDesc', {
            defaultValue: 'La sesión solicitada no existe o no cuenta con los permisos necesarios para verla.',
          })}
        </p>
        <Button onClick={() => navigate('/admin/sessions')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back', { defaultValue: 'Volver a Sesiones' })}
        </Button>
      </div>
    );
  }

  const deviceInfo = parseUserAgent(session.user_agent);

  const getDeviceIcon = () => {
    switch (deviceInfo.deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-primary" />;
      case 'tablet':
        return <Tablet className="h-5 w-5 text-primary" />;
      default:
        return <Laptop className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb y Acciones de cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/admin/sessions">{t('sessions.title', { defaultValue: 'Sesiones' })}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                {t('sessions.detail', { defaultValue: 'Detalle de Sesión' })}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <RefreshButton onClick={refetch} isFetching={isFetching} />

          {canDelete && session.is_valid && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 shadow-sm"
              disabled={isPendingRevoke}
              onClick={() => setRevokeDialogOpen(true)}
            >
              {isPendingRevoke ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              <span>{t('sessions.actions.revoke', { defaultValue: 'Revocar sesión' })}</span>
            </Button>
          )}
        </div>
      </div>

      {/* SECCIÓN: Encabezado principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/admin/sessions')}
            className="h-10 w-10 shrink-0"
            aria-label={t('common.back', { defaultValue: 'Volver' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {deviceInfo.browser} ({deviceInfo.os})
              </h1>
              <SessionStatusBadge session={session} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="truncate">ID: {session.id}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleCopy(session.id, 'session_id')}
                  >
                    {copiedKey === 'session_id' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.copy', { defaultValue: 'Copiar ID' })}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: Contenido en tarjetas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Tarjeta 1: Usuario Asociado */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>{t('sessions.sheet.userSection', { defaultValue: 'Usuario Asociado' })}</span>
            </CardTitle>
            <CardDescription>
              {t('sessions.detailUserDesc', {
                defaultValue: 'Datos del usuario propietario de la sesión activa.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.user', { defaultValue: 'Nombre' })}:</span>
                <span className="font-medium text-foreground">{session.user_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.email', { defaultValue: 'Correo' })}:</span>
                <span className="font-mono text-xs text-foreground">{session.user_email}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-muted-foreground text-xs">{t('sessions.userId', { defaultValue: 'ID de Usuario' })}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{session.user_id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(session.user_id, 'user_id')}
                  >
                    {copiedKey === 'user_id' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              asChild
            >
              <Link to={`/admin/users/edit/${session.user_id}`}>
                <span>{t('sessions.sheet.viewProfile', { defaultValue: 'Ver ficha del usuario' })}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>

            {session.is_impersonated && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>{t('sessions.sheet.impersonatedAlertTitle', { defaultValue: 'Sesión iniciada por suplantación' })}</span>
                </div>
                <p>
                  {t('sessions.sheet.impersonatedAlertDesc', {
                    defaultValue: 'Esta sesión fue generada por un SuperAdmin mediante la funcionalidad de impersonate.',
                  })}
                </p>
                {session.impersonated_by && (
                  <div className="font-mono text-[11px] pt-1">
                    <span>ID de SuperAdmin: </span>
                    <span className="font-bold select-all">{session.impersonated_by}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 2: Dispositivo y Conexión */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {getDeviceIcon()}
              <span>{t('sessions.sheet.deviceSection', { defaultValue: 'Dispositivo y Conexión' })}</span>
            </CardTitle>
            <CardDescription>
              {t('sessions.detailDeviceDesc', {
                defaultValue: 'Parámetros técnicos del navegador, sistema operativo y red.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.browser', { defaultValue: 'Navegador' })}:</span>
                <span className="font-medium text-foreground">{deviceInfo.browser}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.os', { defaultValue: 'Sistema Operativo' })}:</span>
                <span className="font-medium text-foreground">{deviceInfo.os}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.deviceType', { defaultValue: 'Tipo de Dispositivo' })}:</span>
                <span className="font-medium capitalize text-foreground">{deviceInfo.deviceType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.ipAddress', { defaultValue: 'Dirección IP' })}:</span>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{session.ip_address || '-'}</span>
                  {session.ip_address && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleCopy(session.ip_address!, 'ip_address')}
                    >
                      {copiedKey === 'ip_address' ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {session.user_agent && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">User-Agent:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1"
                    onClick={() => handleCopy(session.user_agent!, 'user_agent')}
                  >
                    {copiedKey === 'user_agent' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{t('common.copy', { defaultValue: 'Copiar' })}</span>
                  </Button>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-[11px] font-mono break-all text-muted-foreground leading-relaxed border select-all">
                  {session.user_agent}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 3: Fechas y Expiración */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{t('sessions.sheet.validitySection', { defaultValue: 'Fechas y Expiración' })}</span>
            </CardTitle>
            <CardDescription>
              {t('sessions.detailDatesDesc', {
                defaultValue: 'Tiempos de vigencia, creación y caducidad de la sesión.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.createdAt', { defaultValue: 'Inicio de sesión' })}:</span>
                <span className="font-mono text-xs text-foreground">{formatDate(session.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.expiresAt', { defaultValue: 'Expiración' })}:</span>
                <span className="font-mono text-xs text-foreground">{formatDate(session.expires_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Estado y Trazabilidad */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t('sessions.detailStatusCardTitle', { defaultValue: 'Estado y Trazabilidad' })}</span>
            </CardTitle>
            <CardDescription>
              {t('sessions.detailStatusCardDesc', {
                defaultValue: 'Indicadores de sesión activa, expirada o en uso.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.status.label', { defaultValue: 'Estado' })}:</span>
                <SessionStatusBadge session={session} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.isCurrentLabel', { defaultValue: 'Sesión del navegador actual' })}:</span>
                <span className="font-medium text-foreground">
                  {session.is_current
                    ? t('common.yes', { defaultValue: 'Sí' })
                    : t('common.no', { defaultValue: 'No' })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Confirmación de Revocación */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {session.is_current
                ? t('sessions.dialog.selfRevokeTitle', {
                    defaultValue: '¿Revocar tu sesión actual?',
                  })
                : t('sessions.dialog.revokeTitle', {
                    defaultValue: '¿Revocar sesión de usuario?',
                  })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {session.is_current
                ? t('sessions.dialog.selfRevokeDesc', {
                    defaultValue:
                      'Estás a punto de revocar la sesión con la que estás navegando. Se cerrará tu sesión de inmediato y serás redirigido al inicio de sesión.',
                  })
                : t('sessions.dialog.revokeDesc', {
                    defaultValue:
                      'El usuario perderá el acceso en este dispositivo de forma inmediata y deberá volver a iniciar sesión.',
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPendingRevoke}>
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPendingRevoke}
              onClick={async (e) => {
                e.preventDefault();
                await handleRevoke(session);
                setRevokeDialogOpen(false);
              }}
            >
              {session.is_current
                ? t('sessions.dialog.confirmSelfRevoke', {
                    defaultValue: 'Cerrar sesión y revocar',
                  })
                : t('sessions.dialog.confirmRevoke', {
                    defaultValue: 'Revocar sesión',
                  })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
