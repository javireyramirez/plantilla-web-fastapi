import instance from '@/config/api';
import {
  GetUserAssignmentsQuery,
  UpdateUserRolesBody,
  UserRolesPaginatedResponse,
} from '@/modules/users/model/users.schema';
import { CrudService, cleanApiParams } from '@/services/crud.service';

import {
  BulkResponse,
  BulkUserIdsBody,
  CreateTeam,
  CreateTeamMember,
  GetListQueryType,
  GetTeamMembersQuery,
  GetTeamQuery,
  TeamListResponse,
  TeamMember,
  TeamMemberListResponse,
  TeamResponse,
  UpdateTeam,
} from './teams.schema';

type Item = TeamResponse;
type CreateBody = CreateTeam;
type UpdateBody = UpdateTeam;
type QueryParams = GetTeamQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = TeamListResponse;

export function normalizeTeam(team: any): TeamResponse {
  if (!team) return team;
  const created = team.created_at
    ? new Date(team.created_at)
    : team.createdAt
      ? new Date(team.createdAt)
      : new Date();
  const updated = team.updated_at
    ? new Date(team.updated_at)
    : team.updatedAt
      ? new Date(team.updatedAt)
      : new Date();

  return {
    ...team,
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description ?? null,
    ownerId: team.owner_id ?? team.ownerId ?? null,
    membersCount: team.members_count ?? team.membersCount ?? 0,
    status: team.status ?? 'ACTIVE',
    createdAt: created,
    created_at: team.created_at ?? created.toISOString(),
    updatedAt: updated,
    updated_at: team.updated_at ?? updated.toISOString(),
  };
}

export function normalizeMember(m: any): any {
  if (!m) return m;
  const joinedAt = m.joined_at
    ? new Date(m.joined_at)
    : m.joinedAt
      ? new Date(m.joinedAt)
      : m.created_at
        ? new Date(m.created_at)
        : new Date();

  return {
    ...m,
    id: m.id,
    teamId: m.team_id ?? m.teamId,
    userId: m.user_id ?? m.userId,
    user: {
      id: m.user_id ?? m.userId,
      name: m.user_name ?? m.user?.name ?? null,
      email: m.user_email ?? m.user?.email ?? null,
    },
    roleId: m.role_id ?? m.roleId ?? null,
    roleSlug: m.role_slug ?? m.roleSlug ?? null,
    joinedAt,
    createdAt: m.created_at ? new Date(m.created_at) : joinedAt,
  };
}

class TeamsService extends CrudService<
  Item,
  CreateBody,
  UpdateBody,
  QueryParams,
  ListQueryParams,
  IdType,
  AllResponse
> {
  constructor() {
    super('teams');
  }

  private getMembersPath(teamId: string) {
    return `/teams/${teamId}/members`;
  }

  // ── Lectura ────────────────────────────────
  override getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const params = cleanApiParams(query as Record<string, any>);
    const { data } = await instance.get<any>(`/teams`, { params });
    const items = (data?.data ?? []).map(normalizeTeam);

    return {
      data: items,
      meta: {
        page: data?.meta?.page ?? query?.page ?? 1,
        limit: data?.meta?.limit ?? query?.limit ?? 20,
        total: data?.meta?.total ?? items.length,
        totalPages: data?.meta?.total_pages ?? data?.meta?.totalPages ?? 1,
      },
    };
  };

  getMembers = async (teamId: string, query?: GetTeamMembersQuery) => {
    const { data } = await instance.get<any>(this.getMembersPath(teamId), {
      params: query,
    });
    const rawList = Array.isArray(data) ? data : data?.data ?? [];
    const members = rawList.map(normalizeMember);
    return {
      data: members,
      meta: data?.meta ?? {
        page: 1,
        limit: members.length,
        total: members.length,
        totalPages: 1,
      },
    } as TeamMemberListResponse;
  };

  // ── Escritura individual ───────────────────
  addMember = async (teamId: string, body: CreateTeamMember) => {
    const payload = {
      user_id: (body as any).user_id ?? (body as any).userId,
      role_id: (body as any).role_id ?? (body as any).roleId,
    };
    const { data } = await instance.post<TeamMember>(this.getMembersPath(teamId), payload);
    return normalizeMember(data);
  };

  removeMember = async (teamId: string, userId: string) => {
    const { data } = await instance.delete<TeamMember>(`${this.getMembersPath(teamId)}/${userId}`);
    return data;
  };

  // ── Bulk ───────────────────────────────────
  addMembersBulk = async (teamId: string, body: BulkUserIdsBody) => {
    const userIds = (body as any).userIds ?? (body as any).user_ids ?? [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      await Promise.all(
        userIds.map((uid: string) =>
          instance.post(`${this.getMembersPath(teamId)}`, { user_id: uid })
        )
      );
      return { count: userIds.length };
    }
    const { data } = await instance.post<BulkResponse>(`${this.getMembersPath(teamId)}/bulk`, body);
    return data;
  };

  removeMembersBulk = async (teamId: string, body: BulkUserIdsBody) => {
    const userIds = (body as any).userIds ?? (body as any).user_ids ?? [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      await Promise.all(
        userIds.map((uid: string) =>
          instance.delete(`${this.getMembersPath(teamId)}/${uid}`)
        )
      );
      return { count: userIds.length };
    }
    const { data } = await instance.delete<BulkResponse>(`${this.getMembersPath(teamId)}/bulk`, {
      data: body,
    });
    return data;
  };

  // ── Roles ───────────────────────────────────
  getRoleAssignments = async (teamId: string, params?: GetUserAssignmentsQuery) => {
    const { data } = await instance.get<any>(`/rbac/assignments`, {
      params: {
        team_id: teamId,
        entity_type: 'TEAM',
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    });
    const rawItems = Array.isArray(data) ? data : data?.data ?? [];
    const items = rawItems.map((a: any) => ({
      id: a.role?.id ?? a.roleId ?? a.role_id,
      name: a.role?.name ?? a.role?.slug ?? 'Rol',
      slug: a.role?.slug ?? '',
      assignedAt: a.assigned_at
        ? new Date(a.assigned_at)
        : a.created_at
          ? new Date(a.created_at)
          : new Date(),
      assigned_at: a.assigned_at ?? a.created_at,
      assignmentId: a.id,
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

  addRoleAssignments = async (teamId: string, body: UpdateUserRolesBody) => {
    const roleIds = (body as any).roles ?? (body as any).role_ids ?? [];
    await Promise.all(
      roleIds.map((roleId: string) =>
        instance.post(`/rbac/assignments`, {
          role_id: roleId,
          entity_type: 'TEAM',
          entity_id: teamId,
        })
      )
    );
    return { count: roleIds.length };
  };

  removeRoleAssignments = async (teamId: string, body: UpdateUserRolesBody) => {
    const roleIds = (body as any).roles ?? (body as any).role_ids ?? [];
    await Promise.all(
      roleIds.map((roleId: string) =>
        instance.delete(`/rbac/assignments/${roleId}`)
      )
    );
    return { count: roleIds.length };
  };
}

export const teamsService = new TeamsService();
