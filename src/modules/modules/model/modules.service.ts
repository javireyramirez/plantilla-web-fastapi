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
    super('modules');
  }
}

export const modulesService = new ModulesService();
