import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { markSigningOut } from '@/lib/auth-flags';
import { sessionsQueries } from './sessions.query';
import { SessionAdminType } from './sessions.schema';

export function useSessionDetail(id?: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, isFetching, error, refetch } = sessionsQueries.useGetById(id, {
    enabled: Boolean(id),
  });

  const { mutateAsync: revokeMutate, isPending: isPendingRevoke } = sessionsQueries.useRevoke();

  const handleSelfRevokeLogout = React.useCallback(() => {
    markSigningOut();
    queryClient.clear();
    navigate('/signin', { replace: true });
  }, [queryClient, navigate]);

  const handleRevoke = React.useCallback(
    async (targetSession?: SessionAdminType) => {
      const s = targetSession || session;
      if (!s) return;

      try {
        const res = await revokeMutate(s.id);
        toast.success(
          res.message ||
            t('sessions.toast.revokeSuccess', { defaultValue: 'Sesión revocada correctamente' })
        );

        if (s.is_current) {
          handleSelfRevokeLogout();
        } else {
          refetch();
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message;
        toast.error(
          msg || t('sessions.toast.revokeError', { defaultValue: 'Error al revocar la sesión' })
        );
      }
    },
    [session, revokeMutate, t, handleSelfRevokeLogout, refetch]
  );

  return {
    session,
    isLoading,
    isFetching,
    error,
    refetch,
    handleRevoke,
    isPendingRevoke,
  };
}
