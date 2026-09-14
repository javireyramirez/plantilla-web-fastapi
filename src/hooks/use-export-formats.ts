import { useQuery } from '@tanstack/react-query';

import instance from '@/config/api';

export const DEFAULT_EXPORT_FORMATS = ['csv', 'excel', 'json', 'tsv', 'google_sheets'];

export function useExportFormats(entityName?: string) {
  return useQuery<string[], Error>({
    queryKey: ['export-formats', entityName || 'global'],
    queryFn: async () => {
      try {
        const endpoint = entityName ? `/${entityName}/export/formats` : '/export/formats';
        const { data } = await instance.get<string[]>(endpoint);
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_EXPORT_FORMATS;
      } catch {
        return DEFAULT_EXPORT_FORMATS;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    initialData: DEFAULT_EXPORT_FORMATS,
  });
}
