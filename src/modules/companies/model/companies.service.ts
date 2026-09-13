import instance from '@/config/api';
import { CrudService, cleanApiParams } from '@/services/crud.service';

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

export function normalizeCompany(company: any): Company {
  if (!company) return company;
  return {
    ...company,
    id: company.id,
    name: company.name ?? '',
    nif: company.nif ?? '',
    sector: company.sector ?? null,
    website: company.website ?? null,
    description: company.description ?? null,
    status: company.status ?? 'ACTIVE',
    version: company.version ?? 1,
    createdAt: company.created_at
      ? new Date(company.created_at)
      : company.createdAt
        ? new Date(company.createdAt)
        : new Date(),
    updatedAt: company.updated_at
      ? new Date(company.updated_at)
      : company.updatedAt
        ? new Date(company.updatedAt)
        : new Date(),
    deletedAt: company.deleted_at
      ? new Date(company.deleted_at)
      : company.deletedAt
        ? new Date(company.deletedAt)
        : null,
    restoredAt: company.restored_at
      ? new Date(company.restored_at)
      : company.restoredAt
        ? new Date(company.restoredAt)
        : null,
    created_at:
      company.created_at ??
      (company.createdAt ? new Date(company.createdAt).toISOString() : null),
    updated_at:
      company.updated_at ??
      (company.updatedAt ? new Date(company.updatedAt).toISOString() : null),
    createdBy: company.created_by ?? company.createdBy ?? null,
    updatedBy: company.updated_by ?? company.updatedBy ?? null,
    createdByName: company.created_by_name ?? company.createdByName ?? null,
    updatedByName: company.updated_by_name ?? company.updatedByName ?? null,
    created_by_name: company.created_by_name ?? company.createdByName ?? null,
    updated_by_name: company.updated_by_name ?? company.updatedByName ?? null,
    creator: company.creator ?? null,
    updater: company.updater ?? null,
    ownerId: company.owner_id ?? company.ownerId ?? null,
    owner: company.owner ?? null,
  };
}

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

  override getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const params = cleanApiParams(query as Record<string, any>);
    const { data } = await instance.get<any>(`/${this.entityName}`, { params });
    if (data?.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(normalizeCompany),
      };
    }
    if (Array.isArray(data)) {
      return {
        data: data.map(normalizeCompany),
        meta: {
          page: query?.page ?? 1,
          limit: query?.limit ?? 10,
          total: data.length,
          totalPages: 1,
        },
      } as AllResponse;
    }
    return data;
  };

  override getById = async (id: IdType): Promise<Item> => {
    const { data } = await instance.get<any>(`/${this.entityName}/${id}`);
    return normalizeCompany(data);
  };

  override getList = async (query?: ListQueryParams): Promise<Item[]> => {
    const { data } = await instance.get<any[]>(`/${this.entityName}/list`, { params: query });
    return (data ?? []).map(normalizeCompany);
  };

  override create = async (body: CreateBody): Promise<Item> => {
    const { data } = await instance.post<any>(`/${this.entityName}`, body);
    return normalizeCompany(data);
  };

  override update = async (id: IdType, body: UpdateBody): Promise<Item> => {
    const { data } = await instance.patch<any>(`/${this.entityName}/${id}`, body);
    return normalizeCompany(data);
  };
}

export const companiesService = new CompaniesService();
