import instance from '@/config/api';
import { CrudService } from '@/services/crud.service';

import {
  CreateModules,
  GetListQueryType,
  GetModulesQuery,
  Modules,
  ModulesListResponse,
  UpdateModules,
} from './modules.schema';

type Item = Modules;
type CreateBody = CreateModules;
type UpdateBody = UpdateModules;
type QueryParams = GetModulesQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = ModulesListResponse;

function normalizeModule(m: any): Item {
  const showInNav = m.show_in_nav ?? m.showInNav ?? true;
  const isActive = m.is_active ?? m.isActive ?? true;
  return {
    ...m,
    code: m.code || m.slug,
    slug: m.slug || m.code,
    isActive,
    is_active: isActive,
    supportedActions: m.supported_actions ?? m.supportedActions ?? [],
    categoryName: m.category_name ?? m.categoryName ?? null,
    categoryIcon: m.category_icon ?? m.categoryIcon ?? null,
    categoryOrder: m.category_order ?? m.categoryOrder ?? 0,
    requiresSuperAdmin: m.requires_super_admin ?? m.requiresSuperAdmin ?? false,
    showInNav,
    show_in_nav: showInNav,
  };
}

class ModulesService extends CrudService<
  Item,
  CreateBody,
  UpdateBody,
  QueryParams,
  ListQueryParams,
  IdType,
  AllResponse
> {
  constructor() {
    super('rbac/modules');
  }

  getList = async (_query?: ListQueryParams): Promise<Item[]> => {
    const { data } = await instance.get<any>('/rbac/modules');
    const items = Array.isArray(data) ? data : (data as any)?.data ?? [];
    return items.map(normalizeModule);
  };

  getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const { data } = await instance.get<any>('/rbac/modules', { params: query });
    if (Array.isArray(data)) {
      const items = data.map(normalizeModule);
      return {
        data: items,
        meta: {
          page: (query as any)?.page ?? 1,
          limit: (query as any)?.limit ?? items.length,
          total: items.length,
          totalPages: 1,
        },
      } as AllResponse;
    }
    if (data?.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(normalizeModule),
      };
    }
    return data;
  };
}

export const modulesService = new ModulesService();
