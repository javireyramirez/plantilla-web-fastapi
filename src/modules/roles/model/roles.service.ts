import instance from '@/config/api';
import {
  BulkCreateAssignmentBody,
  BulkCreatePermissionBody,
  BulkUpdatePermissionBody,
  CreateAssignmentBody,
  CreatePermissionBody,
  CreateRole,
  // Tipos de Asignaciones
  GetAssignmentsQuery,
  GetListQueryType,
  // Tipos de Permisos
  GetPermissionsQuery,
  GetRoleQuery,
  RoleAssignmentResponse,
  RoleListResponse,
  // Si necesitas tiparlo explícitamente
  RolePermission,
  RolePermissionsListResponseSchema,
  RoleResponse,
  UpdateRole,
} from '@/modules/roles/model/roles.schema';
import { CrudService } from '@/services/crud.service';

type Item = RoleResponse;
type CreateBody = CreateRole;
type UpdateBody = UpdateRole;
type QueryParams = GetRoleQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = RoleListResponse;

class RolesService extends CrudService<
  Item,
  CreateBody,
  UpdateBody,
  QueryParams,
  ListQueryParams,
  IdType,
  AllResponse
> {
  constructor() {
    super('rbac/roles');
  }

  // ==========================================
  // LECTURA DE ROLES (ADAPTACIÓN FASTAPI)
  // ==========================================

  getAll = async (query?: QueryParams): Promise<AllResponse> => {
    const { data } = await instance.get<any>('/rbac/roles', { params: query });
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

  getList = async (_query?: ListQueryParams): Promise<Item[]> => {
    const { data } = await instance.get<any>('/rbac/roles');
    if (Array.isArray(data)) {
      return data;
    }
    return (data as any)?.data ?? [];
  };

  // ==========================================
  // PERMISOS — LECTURA
  // ==========================================

  /**
   * Obtiene los permisos de un rol específico desde FastAPI /rbac/roles/{roleId}
   */
  async getPermissions(roleId: string, _params?: GetPermissionsQuery) {
    const response = await instance.get<any>(`/rbac/roles/${roleId}`);
    const permissions = response.data?.permissions ?? [];
    return {
      data: permissions as RolePermission[],
      meta: {
        page: 1,
        limit: permissions.length,
        total: permissions.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Reemplaza todos los permisos de un rol en FastAPI (/rbac/roles/{roleId}/permissions)
   */
  async setPermissions(roleId: string, permissions: any[]) {
    const response = await instance.put<any>(`/rbac/roles/${roleId}/permissions`, {
      permissions,
    });
    return response.data;
  }

  // ==========================================
  // PERMISOS — OPERACIONES INDIVIDUALES
  // ==========================================

  /**
   * Vincula un nuevo permiso a un rol
   */
  async addPermission(roleId: string, data: CreatePermissionBody) {
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const updated = [
      ...existing.map((p) => ({
        module_code: (p as any).module_code || (p as any).module?.code,
        action: p.action,
        scope: p.scope,
      })),
      {
        module_code: (data as any).moduleCode || (data as any).module_code,
        action: data.action,
        scope: data.scope,
      },
    ];
    return await this.setPermissions(roleId, updated);
  }

  /**
   * Revoca un permiso de un rol
   */
  async revokePermission(roleId: string, permissionId: string) {
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const updated = existing
      .filter((p: any) => p.id !== permissionId)
      .map((p: any) => ({
        module_code: p.module_code || p.module?.code,
        action: p.action,
        scope: p.scope,
      }));
    return await this.setPermissions(roleId, updated);
  }

  /**
   * Actualiza el scope de un permiso
   */
  async updatePermissionScope(roleId: string, permissionId: string, data: CreatePermissionBody) {
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const updated = existing.map((p: any) => {
      if (p.id === permissionId) {
        return {
          module_code: p.module_code || (data as any).moduleCode || (data as any).module_code,
          action: data.action || p.action,
          scope: data.scope,
        };
      }
      return {
        module_code: p.module_code || p.module?.code,
        action: p.action,
        scope: p.scope,
      };
    });
    return await this.setPermissions(roleId, updated);
  }

  // ==========================================
  // PERMISOS — OPERACIONES MASIVAS (BULK)
  // ==========================================

  async bulkAddPermissions(roleId: string, data: BulkCreatePermissionBody) {
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const newItems = data.map((d) => ({
      module_code: (d as any).moduleCode || (d as any).module_code,
      action: d.action,
      scope: d.scope,
    }));
    await this.setPermissions(roleId, [
      ...existing.map((p: any) => ({
        module_code: p.module_code || p.module?.code,
        action: p.action,
        scope: p.scope,
      })),
      ...newItems,
    ]);
    return { count: newItems.length };
  }

  async bulkRevokePermissions(roleId: string, permissionIds: string[]) {
    const idSet = new Set(permissionIds);
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const updated = existing
      .filter((p: any) => !idSet.has(p.id))
      .map((p: any) => ({
        module_code: p.module_code || p.module?.code,
        action: p.action,
        scope: p.scope,
      }));
    await this.setPermissions(roleId, updated);
    return { count: permissionIds.length };
  }

  async bulkUpdatePermissions(roleId: string, data: BulkUpdatePermissionBody) {
    const updateMap = new Map(data.map((d) => [d.id, d.scope]));
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const updated = existing.map((p: any) => ({
      module_code: p.module_code || p.module?.code,
      action: p.action,
      scope: updateMap.get(p.id) ?? p.scope,
    }));
    await this.setPermissions(roleId, updated);
    return { count: data.length };
  }

  // ==========================================
  // ASIGNACIONES — LECTURA
  // ==========================================

  async getAssignments(roleId: string, params?: GetAssignmentsQuery) {
    const response = await instance.get<any>(`/rbac/assignments`, {
      params: { ...params, role_id: roleId },
    });
    const assignments = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
    return {
      data: assignments as RoleAssignmentResponse[],
      meta: response.data?.meta ?? {
        page: 1,
        limit: assignments.length,
        total: assignments.length,
        totalPages: 1,
      },
    };
  }

  async getAssignmentById(roleId: string, assignmentId: string) {
    const response = await instance.get<RoleAssignmentResponse>(
      `/rbac/assignments/${assignmentId}`
    );
    return response.data;
  }

  // ==========================================
  // ASIGNACIONES — OPERACIONES INDIVIDUALES
  // ==========================================

  async assignRole(roleId: string, data: CreateAssignmentBody) {
    const entity_type = data.userId ? 'USER' : 'TEAM';
    const entity_id = data.userId || data.teamId;
    const response = await instance.post<RoleAssignmentResponse>(`/rbac/assignments`, {
      role_id: roleId,
      entity_type,
      entity_id,
    });
    return response.data;
  }

  async unassignRole(roleId: string, assignmentId: string) {
    const response = await instance.delete<RoleAssignmentResponse>(`/rbac/assignments`, {
      data: {
        role_id: roleId,
        entity_type: 'USER',
        entity_id: assignmentId,
      },
    });
    return response.data;
  }

  // ==========================================
  // ASIGNACIONES — OPERACIONES MASIVAS (BULK)
  // ==========================================

  async bulkAssignRole(roleId: string, data: BulkCreateAssignmentBody) {
    await Promise.all(data.map((item) => this.assignRole(roleId, item)));
    return { count: data.length };
  }

  async bulkUnassignRole(roleId: string, assignmentIds: string[]) {
    await Promise.all(assignmentIds.map((id) => this.unassignRole(roleId, id)));
    return { count: assignmentIds.length };
  }
}

export const rolesService = new RolesService();
