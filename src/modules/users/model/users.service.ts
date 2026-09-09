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

  private getMembersPath(usersId: string) {
    return `/users/${usersId}`;
  }

  resendInvitation = async (usersId: string) => {
    const { data } = await instance.post<Users>(
      `${this.getMembersPath(usersId)}/resend-invitation`
    );
    return data;
  };

  suspend = async (usersId: string) => {
    const { data } = await instance.post<Users>(`${this.getMembersPath(usersId)}/suspend`);
    return data;
  };

  unsuspend = async (usersId: string) => {
    const { data } = await instance.post<Users>(`${this.getMembersPath(usersId)}/unsuspend`);
    return data;
  };

  suspendBulk = async (body: BulkIdsBody) => {
    const { data } = await instance.post<BulkResponse>(`users/bulk/suspend`, body);
    return data;
  };

  unsuspendBulk = async (body: BulkIdsBody) => {
    const { data } = await instance.post<BulkResponse>(`users/bulk/unsuspend`, body);
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
    const { data } = await instance.post<BulkResponse>(
      `${this.getMembersPath(usersId)}/roles`,
      body
    );
    return data;
  };

  removeRoleAssignments = async (usersId: string, body: UpdateUserRolesBody) => {
    const { data } = await instance.delete<BulkResponse>(`${this.getMembersPath(usersId)}/roles`, {
      data: body,
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
    const { data } = await instance.post<BulkResponse>(
      `${this.getMembersPath(usersId)}/teams`,
      body
    );
    return data;
  };

  removeTeamAssignments = async (usersId: string, body: UpdateUserTeamsBody) => {
    const { data } = await instance.delete<BulkResponse>(`${this.getMembersPath(usersId)}/teams`, {
      data: body,
    });
    return data;
  };
}

export const usersService = new UsersService();
