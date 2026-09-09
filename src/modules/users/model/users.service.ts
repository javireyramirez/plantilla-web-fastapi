import instance from '@/config/api';
import {
  BulkIdsBody,
  BulkResponse,
  CreateUsers,
  GetListQueryType,
  GetUserAssignmentsQuery,
  GetUsersQuery,
  UpdateUserRolesBody,
  UpdateUserTeamsBody,
  UpdateUsers,
  UserRolesPaginatedResponse,
  UserTeamsPaginatedResponse,
  Users,
  UsersListResponse,
  UsersResponse,
} from '@/modules/users/model/users.schema';
import { CrudService } from '@/services/crud.service';

type Item = UsersResponse;
type CreateBody = CreateUsers;
type UpdateBody = UpdateUsers;
type QueryParams = GetUsersQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = UsersListResponse;

function normalizeUser(user: any): Users {
  if (!user) return user;
  return {
    ...user,
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    emailVerified: user.email_verified ?? user.emailVerified ?? false,
    isActive: user.is_active ?? user.isActive ?? true,
    isSystem: user.is_system ?? user.isSystem ?? false,
    isSuperAdmin: user.is_super_admin ?? user.isSuperAdmin ?? false,
    createdAt: new Date(user.created_at ?? user.createdAt),
    updatedAt: new Date(user.updated_at ?? user.updatedAt),
  };
}

class UsersService extends CrudService<
  Item,
  CreateBody,
  UpdateBody,
  QueryParams,
  ListQueryParams,
  IdType,
  AllResponse
> {
  constructor() {
    super('users');
  }

  override getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const apiParams: Record<string, any> = {};
    if (query?.page) apiParams.page = query.page;
    if (query?.limit) apiParams.limit = query.limit;
    if ((query as any)?.search) apiParams.search = (query as any).search;
    if ((query as any)?.name) apiParams.search = (query as any).name;
    if (query?.isSystem !== undefined) apiParams.is_system = query.isSystem;
    if (query?.isActive !== undefined) apiParams.is_active = query.isActive;
    if (query?.emailVerified !== undefined) apiParams.email_verified = query.emailVerified;
    if (query?.sortBy) apiParams.sort_by = query.sortBy;
    if (query?.sortOrder) apiParams.sort_order = query.sortOrder;

    const { data } = await instance.get<any>(`/users`, { params: apiParams });
    const items = (data?.data ?? []).map(normalizeUser);

    return {
      data: items,
      meta: {
        page: data?.meta?.page ?? 1,
        limit: data?.meta?.limit ?? 10,
        total: data?.meta?.total ?? 0,
        totalPages: data?.meta?.total_pages ?? data?.meta?.totalPages ?? 1,
      },
    };
  };

  override getById = async (id: IdType): Promise<Item> => {
    const { data } = await instance.get<any>(`/users/${id}`);
    return normalizeUser(data);
  };

  override getList = async (query?: ListQueryParams): Promise<Item[]> => {
    const { data } = await instance.get<any[]>(`/users/list`, { params: query });
    return (data ?? []).map(normalizeUser);
  };

  override create = async (body: CreateBody): Promise<Item> => {
    const { data } = await instance.post<any>(`/users`, body);
    return normalizeUser(data);
  };

  override update = async (id: IdType, body: UpdateBody): Promise<Item> => {
    const { data } = await instance.patch<any>(`/users/${id}`, body);
    return normalizeUser(data);
  };

  private getMembersPath(usersId: string) {
    return `/users/${usersId}`;
  }

  resendInvitation = async (usersId: string) => {
    const { data } = await instance.post<Users>(
      `${this.getMembersPath(usersId)}/resend-invitation`
    );
    return normalizeUser(data);
  };

  suspend = async (usersId: string) => {
    const { data } = await instance.post<Users>(`${this.getMembersPath(usersId)}/suspend`);
    return normalizeUser(data);
  };

  unsuspend = async (usersId: string) => {
    const { data } = await instance.post<Users>(`${this.getMembersPath(usersId)}/reactivate`);
    return normalizeUser(data);
  };

  suspendBulk = async (body: BulkIdsBody) => {
    const payload = { user_ids: (body as any).user_ids ?? body.ids };
    const { data } = await instance.post<BulkResponse>(`/users/bulk/suspend`, payload);
    return data;
  };

  unsuspendBulk = async (body: BulkIdsBody) => {
    const payload = { user_ids: (body as any).user_ids ?? body.ids };
    const { data } = await instance.post<BulkResponse>(`/users/bulk/reactivate`, payload);
    return data;
  };

  // ==========================================
  // ROLES ENDPOINTS
  // ==========================================

  getRoleAssignments = async (usersId: string, params?: GetUserAssignmentsQuery) => {
    const { data } = await instance.get<UserRolesPaginatedResponse>(
      `${this.getMembersPath(usersId)}/roles`,
      { params }
    );
    return data;
  };

  addRoleAssignments = async (usersId: string, body: UpdateUserRolesBody) => {
    const payload = { role_ids: (body as any).role_ids ?? body.roles };
    const { data } = await instance.post<BulkResponse>(
      `${this.getMembersPath(usersId)}/roles`,
      payload
    );
    return data;
  };

  removeRoleAssignments = async (usersId: string, body: UpdateUserRolesBody) => {
    const payload = { role_ids: (body as any).role_ids ?? body.roles };
    const { data } = await instance.delete<BulkResponse>(`${this.getMembersPath(usersId)}/roles`, {
      data: payload,
    });
    return data;
  };

  // ==========================================
  // TEAMS ENDPOINTS
  // ==========================================

  getTeamAssignments = async (usersId: string, params?: GetUserAssignmentsQuery) => {
    const { data } = await instance.get<UserTeamsPaginatedResponse>(
      `${this.getMembersPath(usersId)}/teams`,
      { params }
    );
    return data;
  };

  addTeamAssignments = async (usersId: string, body: UpdateUserTeamsBody) => {
    const payload = { team_ids: (body as any).team_ids ?? body.teams };
    const { data } = await instance.post<BulkResponse>(
      `${this.getMembersPath(usersId)}/teams`,
      payload
    );
    return data;
  };

  removeTeamAssignments = async (usersId: string, body: UpdateUserTeamsBody) => {
    const payload = { team_ids: (body as any).team_ids ?? body.teams };
    const { data } = await instance.delete<BulkResponse>(`${this.getMembersPath(usersId)}/teams`, {
      data: payload,
    });
    return data;
  };
}

export const usersService = new UsersService();
