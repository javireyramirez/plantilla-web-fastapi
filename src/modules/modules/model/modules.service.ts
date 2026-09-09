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
    if (Array.isArray(data)) {
      return data;
    }
    return (data as any)?.data ?? [];
  };

  getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const { data } = await instance.get<any>('/rbac/modules', { params: query });
    if (Array.isArray(data)) {
      return {
        data,
        meta: {
          page: (query as any)?.page ?? 1,
          limit: (query as any)?.limit ?? data.length,
          total: data.length,
          totalPages: 1,
        },
      } as AllResponse;
    }
    return data;
  };
}

export const modulesService = new ModulesService();
