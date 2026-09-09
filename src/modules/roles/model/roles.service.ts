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
    super('roles');
  }

  // ==========================================
  // PERMISOS — LECTURA
  // ==========================================

  /**
   * Obtiene los permisos paginados y filtrados de un rol específico
   */
  async getPermissions(roleId: string, params?: GetPermissionsQuery) {
    const response = await instance.get<{ data: RolePermission[]; meta: any }>(
      `/roles/${roleId}/permissions`,
      { params }
    );
    return response.data;
  }

  // ==========================================
  // PERMISOS — OPERACIONES INDIVIDUALES
  // ==========================================

  /**
   * Vincula un nuevo permiso de forma individual a un rol
   */
  async addPermission(roleId: string, data: CreatePermissionBody) {
    const response = await instance.post<RolePermission>(`/roles/${roleId}/permissions`, data);
    return response.data;
  }

  /**
   * Revoca de forma individual un permiso de un rol
   */
  async revokePermission(roleId: string, permissionId: string) {
    const response = await instance.delete<RolePermission>(
      `/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  }

  /**
   * Actualiza el scope (GLOBAL, TEAM, OWN) de un permiso individual
   */
  async updatePermissionScope(roleId: string, permissionId: string, data: CreatePermissionBody) {
    const response = await instance.patch<RolePermission>(
      `/roles/${roleId}/permissions/${permissionId}`,
      data
    );
    return response.data;
  }

  // ==========================================
  // PERMISOS — OPERACIONES MASIVAS (BULK)
  // ==========================================

  /**
   * Añade múltiples permisos en lote a un rol
   */
  async bulkAddPermissions(roleId: string, data: BulkCreatePermissionBody) {
    const response = await instance.post<{ count: number }>(
      `/roles/${roleId}/permissions/bulk`,
      data
    );
    return response.data;
  }

  /**
   * Revoca múltiples permisos en lote mediante sus IDs
   */
  async bulkRevokePermissions(roleId: string, permissionIds: string[]) {
    const response = await instance.delete<{ count: number }>(`/roles/${roleId}/permissions/bulk`, {
      data: { ids: permissionIds },
    });
    return response.data;
  }

  /**
   * Actualiza los scopes de múltiples permisos en lote
   */
  async bulkUpdatePermissions(roleId: string, data: BulkUpdatePermissionBody) {
    const response = await instance.patch<{ count: number }>(
      `/roles/${roleId}/permissions/bulk`,
      data
    );
    return response.data;
  }

  // ==========================================
  // ASIGNACIONES — LECTURA
  // ==========================================

  /**
   * Obtiene la lista de asignaciones de un rol (usuarios o equipos)
   */
  async getAssignments(roleId: string, params?: GetAssignmentsQuery) {
    const response = await instance.get<{ data: RoleAssignmentResponse[]; meta: any }>(
      `/roles/${roleId}/assignments`,
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene los detalles de una asignación específica dentro de un rol
   */
  async getAssignmentById(roleId: string, assignmentId: string) {
    const response = await instance.get<RoleAssignmentResponse>(
      `/roles/${roleId}/assignments/${assignmentId}`
    );
    return response.data;
  }

  // ==========================================
  // ASIGNACIONES — OPERACIONES INDIVIDUALES
  // ==========================================

  /**
   * Asigna un rol de forma individual a un usuario o equipo
   */
  async assignRole(roleId: string, data: CreateAssignmentBody) {
    const response = await instance.post<RoleAssignmentResponse>(
      `/roles/${roleId}/assignments`,
      data
    );
    return response.data;
  }

  /**
   * Remueve de forma individual la asignación de un rol
   */
  async unassignRole(roleId: string, assignmentId: string) {
    const response = await instance.delete<RoleAssignmentResponse>(
      `/roles/${roleId}/assignments/${assignmentId}`
    );
    return response.data;
  }

  // ==========================================
  // ASIGNACIONES — OPERACIONES MASIVAS (BULK)
  // ==========================================

  /**
   * Crea asignaciones masivas en un rol
   */
  async bulkAssignRole(roleId: string, data: BulkCreateAssignmentBody) {
    const response = await instance.post<{ count: number }>(
      `/roles/${roleId}/assignments/bulk`,
      data
    );
    return response.data;
  }

  /**
   * Elimina asignaciones masivas de un rol mediante un array de IDs de asignación
   */
  async bulkUnassignRole(roleId: string, assignmentIds: string[]) {
    const response = await instance.delete<{ count: number }>(`/roles/${roleId}/assignments/bulk`, {
      data: { ids: assignmentIds },
    });
    return response.data;
  }
}

export const rolesService = new RolesService();
