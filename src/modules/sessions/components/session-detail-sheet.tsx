import * as React from 'react';
import { Calendar, Check, Copy, ExternalLink, Globe, Laptop, ShieldAlert, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SessionAdminType } from '../model/sessions.schema';
import { parseUserAgent } from '../model/sessions.types';
import { SessionStatusBadge } from './session-status-badge';

interface SessionDetailSheetProps {
  session: SessionAdminType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevoke?: (session: SessionAdminType) => void;
  canRevoke?: boolean;
}

export function SessionDetailSheet({
  session,
  open,
  onOpenChange,
  onRevoke,
  canRevoke = false,
}: SessionDetailSheetProps) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!session) return null;

  const deviceInfo = parseUserAgent(session.user_agent);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(t('common.copied', { defaultValue: 'Copiado al portapapeles' }));
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(t('common.copyError', { defaultValue: 'Error al copiar' }));
    }
  };

  const formatDate = (dateVal: string | Date | undefined) => {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold flex items-center justify-between">
              <span>{t('sessions.sheet.title', { defaultValue: 'Detalle de Sesión' })}</span>
              <SessionStatusBadge session={session} />
            </SheetTitle>
            <SheetDescription>
              {t('sessions.sheet.description', {
                defaultValue: 'Información técnica, trazabilidad y estado de conexión.',
              })}
            </SheetDescription>
          </SheetHeader>

          {/* ID de la Sesión */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {t('sessions.sheet.sessionId', { defaultValue: 'ID de Sesión' })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(session.id, 'session_id')}
              >
                {copiedField === 'session_id' ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{t('common.copy', { defaultValue: 'Copiar' })}</span>
              </Button>
            </div>
            <p className="font-mono text-xs break-all text-foreground select-all">{session.id}</p>
          </div>

          {/* Usuario Asociado */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>{t('sessions.sheet.userSection', { defaultValue: 'Usuario' })}</span>
            </h4>
            <div className="rounded-lg border bg-card p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.user', { defaultValue: 'Nombre' })}:</span>
                <span className="font-medium text-foreground">{session.user_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.email', { defaultValue: 'Correo' })}:</span>
                <span className="font-mono text-xs text-foreground">{session.user_email}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(session.user_id, 'user_id')}
                >
                  {copiedField === 'user_id' ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{t('sessions.sheet.copyUserId', { defaultValue: 'Copiar ID' })}</span>
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="h-7 px-0 text-xs gap-1 text-blue-500 hover:text-blue-600"
                  asChild
                >
                  <Link to={`/admin/users/edit/${session.user_id}`}>
                    <span>{t('sessions.sheet.viewProfile', { defaultValue: 'Ver ficha de usuario' })}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Dispositivo y Red */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Laptop className="h-4 w-4 text-primary" />
              <span>{t('sessions.sheet.deviceSection', { defaultValue: 'Dispositivo y Conexión' })}</span>
            </h4>
            <div className="rounded-lg border bg-card p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.browser', { defaultValue: 'Navegador' })}:</span>
                <span className="font-medium text-foreground">{deviceInfo.browser}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.os', { defaultValue: 'Sistema Operativo' })}:</span>
                <span className="font-medium text-foreground">{deviceInfo.os}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.ipAddress', { defaultValue: 'Dirección IP' })}:</span>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span>{session.ip_address || '-'}</span>
                </div>
              </div>
              {session.user_agent && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-muted-foreground block mb-1">User-Agent:</span>
                  <div className="bg-muted/50 rounded p-2 text-[11px] font-mono break-all text-muted-foreground leading-relaxed select-all">
                    {session.user_agent}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fechas de Vigencia */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{t('sessions.sheet.validitySection', { defaultValue: 'Fechas y Expiración' })}</span>
            </h4>
            <div className="rounded-lg border bg-card p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.createdAt', { defaultValue: 'Inicio de sesión' })}:</span>
                <span className="font-mono text-xs text-foreground">{formatDate(session.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('sessions.expiresAt', { defaultValue: 'Expiración' })}:</span>
                <span className="font-mono text-xs text-foreground">{formatDate(session.expires_at)}</span>
              </div>
            </div>
          </div>

          {/* Suplantación (Impersonation) */}
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
        </div>

        {/* Footer con Acción de Revocación */}
        {canRevoke && session.is_valid && (
          <SheetFooter className="pt-6 border-t mt-6 sm:justify-between flex-row items-center gap-3">
            <Button
              variant="destructive"
              className="w-full gap-1.5 shadow-sm"
              onClick={() => {
                onOpenChange(false);
                onRevoke?.(session);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('sessions.actions.revoke', { defaultValue: 'Revocar esta sesión' })}</span>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
