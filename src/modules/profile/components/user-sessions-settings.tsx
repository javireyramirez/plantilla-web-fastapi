import {
  Globe,
  Laptop,
  LoaderCircle,
  LogOut,
  Monitor,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMySessions, useRevokeAllSessions, useRevokeSession } from '@/hooks/use-auth';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { parseUserAgent } from '@/modules/sessions/model/sessions.types';

interface UserSessionItem {
  id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  expires_at: string;
  is_current: boolean;
  impersonated_by?: string | null;
}

export function UserSessionsSettings() {
  const { t } = useTranslation();
  const { data: sessions, isLoading, refetch, isFetching } = useMySessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllSessionsMutation = useRevokeAllSessions();

  const [sessionToRevoke, setSessionToRevoke] = useState<UserSessionItem | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const parsedSessions = useMemo<UserSessionItem[]>(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    // Ensure current session appears first, then sorted by created_at desc
    return [...sessions].sort((a, b) => {
      if (a.is_current && !b.is_current) return -1;
      if (!a.is_current && b.is_current) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sessions]);

  const otherSessionsCount = useMemo(
    () => parsedSessions.filter((s) => !s.is_current).length,
    [parsedSessions]
  );

  const handleRevokeSingle = async () => {
    if (!sessionToRevoke) return;
    try {
      await revokeSessionMutation.mutateAsync(sessionToRevoke.id);
      toast.success(
        t('sessions.toast.revokeSuccess', {
          defaultValue: 'Sesión revocada correctamente',
        })
      );
      setSessionToRevoke(null);
    } catch (err: any) {
      toast.error(
        err.message ||
          t('sessions.toast.revokeError', { defaultValue: 'Error al revocar la sesión' })
      );
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllSessionsMutation.mutateAsync();
      toast.success(
        t('profile.allSessionsRevoked', {
          defaultValue: 'Todas las sesiones han sido cerradas.',
        })
      );
      setShowRevokeAllDialog(false);
    } catch (err: any) {
      toast.error(
        err.message ||
          t('profile.revokeAllError', { defaultValue: 'Error al revocar las sesiones' })
      );
    }
  };

  const getDeviceIcon = (ua?: string | null) => {
    const info = parseUserAgent(ua);
    switch (info.deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
        return Monitor;
      default:
        return Laptop;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              {t('profile.activeSessionsTitle', { defaultValue: 'Dispositivos y Sesiones Activas' })}
            </CardTitle>
            <CardDescription>
              {t('profile.activeSessionsDesc', {
                defaultValue:
                  'Consulta los dispositivos donde tu cuenta tiene una sesión abierta y revoca el acceso si no los reconoces.',
              })}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {otherSessionsCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-2"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={revokeAllSessionsMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                {t('profile.revokeAllSessionsBtn', {
                  defaultValue: 'Cerrar todas las demás sesiones',
                })}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : parsedSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('profile.noActiveSessions', { defaultValue: 'No se encontraron sesiones activas.' })}
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
              {parsedSessions.map((sess) => {
                const info = parseUserAgent(sess.user_agent);
                const Icon = getDeviceIcon(sess.user_agent);
                const isRevoking =
                  revokeSessionMutation.isPending &&
                  sessionToRevoke?.id === sess.id;

                return (
                  <div
                    key={sess.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors',
                      sess.is_current ? 'bg-primary/5' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          'p-2.5 rounded-full shrink-0 mt-0.5 sm:mt-0',
                          sess.is_current
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {info.browser} · {info.os}
                          </span>

                          {sess.is_current && (
                            <Badge variant="default" className="text-[11px] font-normal py-0 h-5">
                              {t('sessions.status.current', { defaultValue: 'Sesión actual' })}
                            </Badge>
                          )}

                          {sess.impersonated_by && (
                            <Badge variant="outline" className="text-[11px] border-amber-500/40 text-amber-600 bg-amber-500/10 gap-1 py-0 h-5">
                              <ShieldAlert className="h-3 w-3" />
                              {t('sessions.status.impersonated', { defaultValue: 'Suplantada' })}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {sess.ip_address && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 font-mono hover:text-foreground cursor-default">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  {sess.ip_address}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {t('sessions.ipAddress', { defaultValue: 'Dirección IP' })}: {sess.ip_address}
                              </TooltipContent>
                            </Tooltip>
                          )}

                          <span>
                            {t('sessions.createdAt', { defaultValue: 'Inicio' })}:{' '}
                            {formatDate(sess.created_at, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            } as any)}
                          </span>

                          <span className="text-muted-foreground/60">·</span>

                          <span>
                            {t('sessions.expiresAt', { defaultValue: 'Expira' })}:{' '}
                            {formatDate(sess.expires_at, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            } as any)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0 sm:self-center">
                      {sess.is_current ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 bg-emerald-500/10 rounded-md">
                          {t('profile.thisDevice', { defaultValue: 'Este dispositivo' })}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 h-8 text-xs font-medium"
                          onClick={() => setSessionToRevoke(sess)}
                          disabled={isRevoking}
                        >
                          {isRevoking ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <LogOut className="h-3.5 w-3.5" />
                          )}
                          {t('sessions.actions.revoke', { defaultValue: 'Cerrar sesión' })}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO: Revocar Sesión Individual */}
      <AlertDialog
        open={Boolean(sessionToRevoke)}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('sessions.dialog.revokeTitle', { defaultValue: '¿Cerrar esta sesión de dispositivo?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('sessions.dialog.revokeDesc', {
                defaultValue:
                  'El dispositivo perderá el acceso a la plataforma inmediatamente y requerirá un nuevo inicio de sesión.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeSessionMutation.isPending}>
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSingle}
              disabled={revokeSessionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeSessionMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('profile.revoking', { defaultValue: 'Cerrando...' })}
                </>
              ) : (
                t('sessions.dialog.confirmRevoke', { defaultValue: 'Cerrar sesión' })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO: Revocar Todas las Sesiones */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profile.revokeAllTitle', {
                defaultValue: '¿Cerrar todas las sesiones remotas?',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.revokeAllDesc', {
                defaultValue:
                  'Se cerrarán todas las sesiones abiertas en otros dispositivos. Tu dispositivo actual podría requerir volver a iniciar sesión según la configuración de seguridad.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeAllSessionsMutation.isPending}>
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              disabled={revokeAllSessionsMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeAllSessionsMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('profile.revoking', { defaultValue: 'Cerrando...' })}
                </>
              ) : (
                t('profile.confirmRevokeAll', { defaultValue: 'Cerrar todas' })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default UserSessionsSettings;
