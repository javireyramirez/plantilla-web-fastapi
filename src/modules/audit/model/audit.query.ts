import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';

import { AuditLogType, AuditLogsListResponse, GetAuditLogsQuery } from './audit.schema';
import { auditService } from './audit.service';
import type { JobType } from '@/modules/jobs/model/jobs.schema';

export const auditQueries = {
  useGetAll: (
    query?: GetAuditLogsQuery,
    options?: Omit<UseQueryOptions<AuditLogsListResponse, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<AuditLogsListResponse, Error>({
      queryKey: ['audit', 'all', query],
      queryFn: () => auditService.getAudit(query),
      staleTime: 0,
      refetchOnMount: 'always',
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
      staleTime: 0,
      refetchOnMount: 'always',
      ...options,
    });
  },

  useExport: () => {
    return useMutation<Blob | JobType, Error, any>({
      mutationFn: (body: any) => auditService.export(body),
    });
  },

  useExportFormats: () => {
    return useQuery<string[], Error>({
      queryKey: ['audit', 'export-formats'],
      queryFn: () => auditService.getExportFormats(),
      staleTime: 1000 * 60 * 60,
    });
  },
};
