import { CrudService } from '@/services/crud.service';

import {
  CompaniesListResponse,
  Company,
  CreateCompany,
  GetCompaniesQuery,
  GetListQueryType,
  UpdateCompany,
} from './companies.schema';

type Item = Company;
type CreateBody = CreateCompany;
type UpdateBody = UpdateCompany;
type QueryParams = GetCompaniesQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = CompaniesListResponse;

class CompaniesService extends CrudService<
  Item,
  CreateBody,
  UpdateBody,
  QueryParams,
  ListQueryParams,
  IdType,
  AllResponse
> {
  constructor() {
    super('companies');
  }
}

export const companiesService = new CompaniesService();
