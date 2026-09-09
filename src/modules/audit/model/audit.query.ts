import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { AuditLogType, AuditLogsListResponse, GetAuditLogsQuery } from './audit.schema';
import { auditService } from './audit.service';

export const auditQueries = {
  useGetAll: (
    query?: GetAuditLogsQuery,
    options?: Omit<UseQueryOptions<AuditLogsListResponse, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<AuditLogsListResponse, Error>({
      queryKey: ['audit', 'all', query],
      queryFn: () => auditService.getAudit(query),
      ...options,
    });
  },

  useGetById: (
    id: string,
    options?: Omit<UseQueryOptions<AuditLogType, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<AuditLogType, Error>({
      queryKey: ['audit', 'detail', id],
      queryFn: () => auditService.getAuditById(id),
      enabled: !!id && (options?.enabled ?? true),
      ...options,
    });
  },
};
