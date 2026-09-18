import { LoaderCircle, LogOut, ShieldAlert } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useSession } from '@/config/auth-client';
import { useCurrentUser, useExitImpersonation } from '@/hooks/use-auth';

export function ImpersonateBanner() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();
  const exitImpersonationMutation = useExitImpersonation();

  const isImpersonated = Boolean(
    currentUser?.session?.impersonated_by ||
      (session as any)?.session?.impersonated_by ||
      (session as any)?.user?.impersonated_by ||
      localStorage.getItem('is_impersonated') === 'true'
  );

  if (!isImpersonated) {
    return null;
  }

  const user = currentUser?.user || currentUser || session?.user;
  const displayName = user?.name || user?.email || 'Usuario';
  const displayEmail = user?.email;

  const handleExit = () => {
    exitImpersonationMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('impersonate.exitedSuccess', { defaultValue: 'Sesión de suplantación finalizada' }));
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || 'Error al salir de la suplantación');
      },
    });
  };

  return (
    <aside
      aria-label="Aviso de suplantación"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 text-amber-950 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md transition-all"
    >
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-950 animate-pulse" />
        <p className="truncate">
          <span>{t('impersonate.bannerNotice', { defaultValue: 'Modo Suplantación Activo:' })}</span>{' '}
          <strong className="font-semibold">{displayName}</strong>
          {displayEmail && displayName !== displayEmail && (
            <span className="opacity-90"> ({displayEmail})</span>
          )}
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleExit}
        disabled={exitImpersonationMutation.isPending}
        className="shrink-0 bg-white/90 text-amber-950 hover:bg-white hover:text-amber-950 border-amber-600/40 h-7 px-2.5 text-xs font-semibold gap-1.5 shadow-xs"
      >
        {exitImpersonationMutation.isPending ? (
          <>
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            <span>{t('impersonate.exiting', { defaultValue: 'Saliendo...' })}</span>
          </>
        ) : (
          <>
            <LogOut className="h-3.5 w-3.5" />
            <span>{t('impersonate.exitBtn', { defaultValue: 'Salir de suplantación' })}</span>
          </>
        )}
      </Button>
    </aside>
  );
}
export default ImpersonateBanner;
