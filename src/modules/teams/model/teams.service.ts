import instance from '@/config/api';
import {
  GetUserAssignmentsQuery,
  UpdateUserRolesBody,
  UserRolesPaginatedResponse,
} from '@/modules/users/model/users.schema';
import { CrudService } from '@/services/crud.service';

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
    return `/teams/${teamId}/users`;
  }

  // ── Lectura ────────────────────────────────
  getMembers = async (teamId: string, query?: GetTeamMembersQuery) => {
    const { data } = await instance.get<TeamMemberListResponse>(this.getMembersPath(teamId), {
      params: query,
    });
    return data;
  };

  // ── Escritura individual ───────────────────
  addMember = async (teamId: string, body: CreateTeamMember) => {
    const { data } = await instance.post<TeamMember>(this.getMembersPath(teamId), body);
    return data;
  };

  removeMember = async (teamId: string, userId: string) => {
    const { data } = await instance.delete<TeamMember>(`${this.getMembersPath(teamId)}/${userId}`);
    return data;
  };

  // ── Bulk ───────────────────────────────────
  addMembersBulk = async (teamId: string, body: BulkUserIdsBody) => {
    const { data } = await instance.post<BulkResponse>(`${this.getMembersPath(teamId)}/bulk`, body);
    return data;
  };

  removeMembersBulk = async (teamId: string, body: BulkUserIdsBody) => {
    const { data } = await instance.delete<BulkResponse>(`${this.getMembersPath(teamId)}/bulk`, {
      data: body,
    });
    return data;
  };

  // ── Roles ───────────────────────────────────
  getRoleAssignments = async (teamId: string, params?: GetUserAssignmentsQuery) => {
    const { data } = await instance.get<UserRolesPaginatedResponse>(
      `/teams/${teamId}/roles`,
      { params }
    );
    return data;
  };

  addRoleAssignments = async (teamId: string, body: UpdateUserRolesBody) => {
    const { data } = await instance.post<BulkResponse>(
      `/teams/${teamId}/roles`,
      body
    );
    return data;
  };

  removeRoleAssignments = async (teamId: string, body: UpdateUserRolesBody) => {
    const { data } = await instance.delete<BulkResponse>(`/teams/${teamId}/roles`, {
      data: body,
    });
    return data;
  };
}

export const teamsService = new TeamsService();
