import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { jobsQueries } from './jobs.query';

export function useJobDetail(id?: string) {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, error, refetch } = jobsQueries.useGetById(id as string, {
    enabled: !!id,
  });

  const { mutateAsync: cancelMutate, isPending: isPendingCancel } = jobsQueries.useCancel();
  const { mutateAsync: retryMutate, isPending: isPendingRetry } = jobsQueries.useRetry();

  const handleCancel = async () => {
    if (!id) return;
    try {
      const res = await cancelMutate(id);
      toast.success(
        t('jobs.toast.cancelSuccess', { defaultValue: res?.message || 'Tarea cancelada correctamente' })
      );
      refetch();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(
        t('jobs.toast.cancelError', { defaultValue: serverMessage || 'Error al cancelar la tarea' })
      );
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    try {
      const res = await retryMutate(id);
      toast.success(
        t('jobs.toast.retrySuccess', { defaultValue: res?.message || 'Tarea reencolada para reintento' })
      );
      refetch();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(
        t('jobs.toast.retryError', { defaultValue: serverMessage || 'Error al reintentar la tarea' })
      );
    }
  };

  return {
    job: data,
    isLoading,
    isFetching,
    error,
    refetch,
    handleCancel,
    isPendingCancel,
    handleRetry,
    isPendingRetry,
  };
}
