import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { auditQueries } from './audit.query';

export function useAuditDetail(id?: string) {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, error } = auditQueries.useGetById(id as string, {
    enabled: !!id,
  });

  const { mutateAsync: mutateExport, isPending: isPendingExport } = auditQueries.useExport();

  const handleExport = async (format: string = 'csv') => {
    if (!id) return;
    try {
      await mutateExport({
        ids: [id],
        format,
      });
      toast.success(t('export.success', { defaultValue: 'Exportado con éxito' }));
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(serverMessage || t('export.error', { defaultValue: 'Error al exportar' }));
    }
  };

  return {
    auditLog: data,
    isLoading,
    isFetching,
    error,
    handleExport,
    isPendingExport,
  };
}
