import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

import { GetSettingsQuery, Setting, UpdateSettingBody } from './settings.schema';
import { settingsService } from './settings.service';

export const settingsQueries = {
  useGetAll: (
    query?: GetSettingsQuery,
    options?: Omit<UseQueryOptions<Setting[], Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<Setting[], Error>({
      queryKey: ['settings', 'all', query],
      queryFn: () => settingsService.getAll(query),
      staleTime: 60 * 1000,
      ...options,
    });
  },

  useGetByKey: (
    key: string,
    options?: Omit<UseQueryOptions<Setting, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<Setting, Error>({
      queryKey: ['settings', 'detail', key],
      queryFn: () => settingsService.getByKey(key),
      enabled: !!key && (options?.enabled ?? true),
      staleTime: 60 * 1000,
      ...options,
    });
  },

  useUpdate: (key: string) => {
    const queryClient = useQueryClient();

    return useMutation<Setting, Error, UpdateSettingBody>({
      mutationFn: (body: UpdateSettingBody) => settingsService.update(key, body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      },
    });
  },
};
