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
import { CrudService, cleanApiParams } from '@/services/crud.service';

type Item = UsersResponse;
type CreateBody = CreateUsers;
type UpdateBody = UpdateUsers;
type QueryParams = GetUsersQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = UsersListResponse;

function normalizeUser(user: any): Users {
  if (!user) return user;
  const isSys = user.is_system ?? user.isSystem ?? false;
  const isAct = user.is_active ?? user.isActive ?? true;
  const isSuper = user.is_super_admin ?? user.isSuperAdmin ?? false;
  const emailVer = user.email_verified ?? user.emailVerified ?? false;
  const created = user.created_at
    ? new Date(user.created_at)
    : user.createdAt
      ? new Date(user.createdAt)
      : new Date();
  const updated = user.updated_at
    ? new Date(user.updated_at)
    : user.updatedAt
      ? new Date(user.updatedAt)
      : new Date();

  return {
    ...user,
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    emailVerified: emailVer,
    email_verified: emailVer,
    isActive: isAct,
    is_active: isAct,
    isSystem: isSys,
    is_system: isSys,
    isSuperAdmin: isSuper,
    is_super_admin: isSuper,
    createdAt: created,
    created_at: user.created_at ?? created.toISOString(),
    updatedAt: updated,
    updated_at: user.updated_at ?? updated.toISOString(),
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
    const { data } = await instance.get<any>(`/users`, {
      params: cleanApiParams(query as Record<string, any>),
    });
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
    const { data } = await instance.get<any>(
      `${this.getMembersPath(usersId)}/roles`,
      { params }
    );
    const items = (data?.data ?? []).map((r: any) => ({
      ...r,
      id: r.id,
      name: r.name,
      slug: r.slug,
      assignedAt: r.assigned_at ? new Date(r.assigned_at) : (r.assignedAt ? new Date(r.assignedAt) : new Date()),
      assigned_at: r.assigned_at ?? r.assignedAt,
    }));
    return {
      data: items,
      meta: data?.meta ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? items.length,
        total: items.length,
        totalPages: 1,
      },
    } as UserRolesPaginatedResponse;
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
    const { data } = await instance.get<any>(
      `${this.getMembersPath(usersId)}/teams`,
      { params }
    );
    const items = (data?.data ?? []).map((t: any) => ({
      ...t,
      id: t.id,
      name: t.name,
      slug: t.slug,
      joinedAt: t.joined_at ? new Date(t.joined_at) : (t.joinedAt ? new Date(t.joinedAt) : new Date()),
      joined_at: t.joined_at ?? t.joinedAt,
    }));
    return {
      data: items,
      meta: data?.meta ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? items.length,
        total: items.length,
        totalPages: 1,
      },
    } as UserTeamsPaginatedResponse;
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
