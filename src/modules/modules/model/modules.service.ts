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
    return items.map((m: any) => ({
      ...m,
      code: m.code || m.slug,
      slug: m.slug || m.code,
      isTrasheable: m.is_trasheable ?? m.isTrasheable ?? false,
      categoryName: m.category_name ?? m.categoryName ?? null,
      categoryIcon: m.category_icon ?? m.categoryIcon ?? null,
      categoryOrder: m.category_order ?? m.categoryOrder ?? 0,
    }));
  };

  getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const { data } = await instance.get<any>('/rbac/modules', { params: query });
    if (Array.isArray(data)) {
      const items = data.map((m: any) => ({
        ...m,
        code: m.code || m.slug,
        slug: m.slug || m.code,
        isTrasheable: m.is_trasheable ?? m.isTrasheable ?? false,
        categoryName: m.category_name ?? m.categoryName ?? null,
        categoryIcon: m.category_icon ?? m.categoryIcon ?? null,
        categoryOrder: m.category_order ?? m.categoryOrder ?? 0,
      }));
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
        data: data.data.map((m: any) => ({
          ...m,
          code: m.code || m.slug,
          slug: m.slug || m.code,
          isTrasheable: m.is_trasheable ?? m.isTrasheable ?? false,
          categoryName: m.category_name ?? m.categoryName ?? null,
          categoryIcon: m.category_icon ?? m.categoryIcon ?? null,
          categoryOrder: m.category_order ?? m.categoryOrder ?? 0,
        })),
      };
    }
    return data;
  };
}

export const modulesService = new ModulesService();
