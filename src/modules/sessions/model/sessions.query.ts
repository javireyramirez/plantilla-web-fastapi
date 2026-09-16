import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import {
  BulkResponse,
  GetSessionsQuery,
  MessageResponse,
  SessionsListResponse,
} from './sessions.schema';
import { sessionsService } from './sessions.service';

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
    return useMutation<Blob, Error, any>({
      mutationFn: (payload: any) => sessionsService.export(payload),
    });
  },
};
