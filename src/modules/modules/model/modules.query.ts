import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/config/auth-client';
import { createGenericQueries } from '@/hooks/use-crud';

import { modulesService } from './modules.service';

export const modulesQueries = createGenericQueries(modulesService, 'modules');

const MODULES_QUERY_OPTIONS = {
  staleTime: Infinity,
  gcTime: 1000 * 60 * 60 * 24, // 24 hours
} as const;

export function useModules() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: modules = [], isLoading } = modulesQueries.useGetList(undefined, {
    ...MODULES_QUERY_OPTIONS,
    enabled: !!userId,
  });

  const modulesMap = React.useMemo(() => {
    const map = new Map<string, string>();
    modules.forEach((m: any) => {
      const code = (m.code || m.slug || '').toLowerCase().trim();
      if (code) {
        map.set(code, m.name || m.code || m.slug);
      }
    });
    return map;
  }, [modules]);

  const getModuleName = React.useCallback(
    (code: string | null | undefined): string => {
      if (!code) return '-';
      const clean = code.toLowerCase().trim();
      return t(`modules.names.${clean}`, { defaultValue: modulesMap.get(clean) || code });
    },
    [modulesMap, t]
  );

  return {
    modules,
    modulesMap,
    getModuleName,
    isLoading,
  };
}

export function useModulesOptions(params?: { name?: string; [key: string]: any }) {
  const { t } = useTranslation();
  const { modules, isLoading } = useModules();

  const options = React.useMemo(() => {
    if (!modules) return [];
    let items = modules.map((m: any) => {
      const code = (m.code ?? m.slug ?? '').toLowerCase().trim();
      const categoryKey = (m.category || 'system').toLowerCase().trim();
      const label = t(`modules.names.${code}`, { defaultValue: m.name ?? code });
      const groupLabel = t(`modules.categories.${categoryKey}`, {
        defaultValue: m.categoryName || m.category_name || m.category || categoryKey,
      });
      return {
        id: code,
        name: label,
        group: groupLabel,
        order: m.categoryOrder ?? m.category_order ?? 99,
      };
    });
    items.sort((a: any, b: any) => a.order - b.order || a.name.localeCompare(b.name));
    if (params?.name) {
      const q = params.name.toLowerCase().trim();
      items = items.filter(
        (item: any) =>
          item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
    }
    return items;
  }, [modules, params?.name, t]);

  return {
    data: options,
    isLoading,
  };
}

export function useEntityTrashModulesOptions(params?: { name?: string; [key: string]: any }) {
  const { t } = useTranslation();
  const { modules, isLoading } = useModules();

  const options = React.useMemo(() => {
    if (!modules) return [];
    let items = modules
      .filter(
        (m: any) =>
          m.supportedActions?.includes('RESTORE') &&
          m.code !== 'documents' &&
          m.code !== 'storage'
      )
      .map((m: any) => {
        const code = (m.code ?? m.slug ?? '').toLowerCase().trim();
        const categoryKey = (m.category || 'system').toLowerCase().trim();
        const label = t(`modules.names.${code}`, { defaultValue: m.name ?? code });
        const groupLabel = t(`modules.categories.${categoryKey}`, {
          defaultValue: m.categoryName || m.category_name || m.category || categoryKey,
        });
        return {
          id: code,
          name: label,
          group: groupLabel,
          order: m.categoryOrder ?? m.category_order ?? 99,
        };
      });
    items.sort((a: any, b: any) => a.order - b.order || a.name.localeCompare(b.name));
    if (params?.name) {
      const q = params.name.toLowerCase().trim();
      items = items.filter(
        (item: any) =>
          item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
    }
    return items;
  }, [modules, params?.name, t]);

  return {
    data: options,
    isLoading,
  };
}

