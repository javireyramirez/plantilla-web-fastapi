import * as React from 'react';

import { createGenericQueries } from '@/hooks/use-crud';

import { modulesService } from './modules.service';

export const modulesQueries = createGenericQueries(modulesService, 'modules');

export function useModulesOptions(params?: { name?: string; [key: string]: any }) {
  const { data, isLoading } = modulesQueries.useGetList();

  const options = React.useMemo(() => {
    if (!data) return [];
    let items = data.map((m: any) => ({
      id: m.code ?? m.slug,
      name: m.name ?? m.code ?? m.slug,
    }));
    if (params?.name) {
      const q = params.name.toLowerCase().trim();
      items = items.filter(
        (item: any) =>
          item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
    }
    return items;
  }, [data, params?.name]);

  return {
    data: options,
    isLoading,
  };
}
