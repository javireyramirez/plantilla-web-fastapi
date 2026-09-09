import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

import { BulkIdsBody, BulkResponse, GetTrashQuery, TrashListResponse } from './trash.schema';
import { trashService } from './trash.service';

export const trashQueries = {
  useGetTrash: (
    query?: GetTrashQuery,
    options?: Omit<UseQueryOptions<TrashListResponse, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<TrashListResponse, Error>({
      queryKey: ['trash', 'list', query],
      queryFn: () => trashService.getTrash(query),
      staleTime: 0,
      refetchOnMount: 'always',
      ...options,
    });
  },

  useBulkRestore: () => {
    const queryClient = useQueryClient();
    return useMutation<BulkResponse, Error, BulkIdsBody>({
      mutationFn: (body) => trashService.bulkRestore(body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trash'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      },
    });
  },

  useBulkDelete: () => {
    const queryClient = useQueryClient();
    return useMutation<BulkResponse, Error, BulkIdsBody>({
      mutationFn: (body) => trashService.bulkDelete(body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trash'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      },
    });
  },
};
