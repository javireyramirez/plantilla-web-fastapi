import { auditQueries } from './audit.query';

export function useAuditDetail(id?: string) {
  const { data, isLoading, isFetching, error } = auditQueries.useGetById(id as string, {
    enabled: !!id,
  });

  return {
    auditLog: data,
    isLoading,
    isFetching,
    error,
  };
}
