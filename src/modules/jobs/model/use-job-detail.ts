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
        res.message || t('jobs.toast.cancelSuccess', { defaultValue: 'Tarea cancelada correctamente' })
      );
      refetch();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(
        serverMessage || t('jobs.toast.cancelError', { defaultValue: 'Error al cancelar la tarea' })
      );
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    try {
      const res = await retryMutate(id);
      toast.success(
        res.message || t('jobs.toast.retrySuccess', { defaultValue: 'Tarea reencolada para reintento' })
      );
      refetch();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(
        serverMessage || t('jobs.toast.retryError', { defaultValue: 'Error al reintentar la tarea' })
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
