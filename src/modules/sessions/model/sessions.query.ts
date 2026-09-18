import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import {
  BulkResponse,
  GetSessionsQuery,
  MessageResponse,
  SessionAdminType,
  SessionsListResponse,
} from './sessions.schema';
import { sessionsService } from './sessions.service';
import type { JobType } from '@/modules/jobs/model/jobs.schema';

export const sessionsQueries = {
  useGetAll: (
    query?: GetSessionsQuery,
    options?: Omit<UseQueryOptions<SessionsListResponse, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<SessionsListResponse, Error>({
      queryKey: ['sessions', 'all', query],
      queryFn: () => sessionsService.getSessions(query),
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
      ...options,
    });
  },

  useGetById: (
    id?: string,
    options?: Omit<UseQueryOptions<SessionAdminType, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<SessionAdminType, Error>({
      queryKey: ['sessions', 'detail', id],
      queryFn: () => {
        if (!id) throw new Error('ID de sesión requerido');
        return sessionsService.getSessionById(id);
      },
      enabled: Boolean(id),
      staleTime: 1000 * 10,
      ...options,
    });
  },

  useRevoke: () => {
    const queryClient = useQueryClient();
    return useMutation<MessageResponse, Error, string>({
      mutationFn: (id: string) => sessionsService.revokeSession(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    });
  },

  useBulkRevoke: () => {
    const queryClient = useQueryClient();
    return useMutation<BulkResponse, Error, string[]>({
      mutationFn: (ids: string[]) => sessionsService.bulkRevoke(ids),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    });
  },

  useExport: () => {
    return useMutation<Blob | JobType, Error, any>({
      mutationFn: (payload: any) => sessionsService.export(payload),
    });
  },
};
