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
  Role,
  RolePermission,
  RolePermissionItem,
  RolePermissionsListResponseSchema,
  RoleResponse,
  UpdateRole,
} from '@/modules/roles/model/roles.schema';
import { CrudService, cleanApiParams } from '@/services/crud.service';

type Item = RoleResponse;
type CreateBody = CreateRole;
type UpdateBody = UpdateRole;
type QueryParams = GetRoleQuery;
type ListQueryParams = GetListQueryType;
type IdType = string;
type AllResponse = RoleListResponse;

export function normalizeRole(role: any): Role {
  if (!role) return role;
  const isSys = role.is_system ?? role.isSystem ?? false;
  const created = role.created_at
    ? new Date(role.created_at)
    : role.createdAt
      ? new Date(role.createdAt)
      : new Date();
  const updated = role.updated_at
    ? new Date(role.updated_at)
    : role.updatedAt
      ? new Date(role.updatedAt)
      : new Date();

  return {
    ...role,
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description ?? null,
    color: role.color ?? null,
    icon: role.icon ?? null,
    isSystem: isSys,
    is_system: isSys,
    status: role.status ?? 'ACTIVE',
    permissions: role.permissions ?? [],
    createdAt: created,
    created_at: role.created_at ?? created.toISOString(),
    updatedAt: updated,
    updated_at: role.updated_at ?? updated.toISOString(),
  };
}

export function normalizeAssignment(a: any): RoleAssignmentResponse {
  if (!a) return a;
  const assignedAt = a.assigned_at
    ? new Date(a.assigned_at)
    : a.assignedAt
      ? new Date(a.assignedAt)
      : a.created_at
        ? new Date(a.created_at)
        : new Date();

  return {
    ...a,
    id: a.id,
    roleId: a.role_id ?? a.roleId,
    userId: a.user_id ?? a.userId ?? null,
    teamId: a.team_id ?? a.teamId ?? null,
    entityType: a.entity_type ?? a.entityType,
    entityId: a.entity_id ?? a.entityId,
    assignedAt,
    assigned_at: a.assigned_at ?? assignedAt.toISOString(),
    assignedUser: a.assigned_user ?? a.assignedUser ?? a.user ?? null,
    assignedTeam: a.assigned_team ?? a.assignedTeam ?? a.team ?? null,
    role: a.role ?? null,
  };
}

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
    const params = cleanApiParams(query as Record<string, any>);
    const { data } = await instance.get<any>('/rbac/roles', { params });
    let items = (Array.isArray(data) ? data : data?.data ?? []).map(normalizeRole);

    // Filtrado adicional si el backend devolvió lista completa sin filtrar
    if (query?.name) {
      const search = query.name.toLowerCase();
      items = items.filter(
        (r: Role) =>
          r.name.toLowerCase().includes(search) ||
          (r.slug && r.slug.toLowerCase().includes(search))
      );
    }
    const isSysVal = (query as any)?.is_system !== undefined ? (query as any).is_system : query?.isSystem;
    if (isSysVal !== undefined) {
      items = items.filter((r: Role) => (r.is_system ?? r.isSystem) === isSysVal);
    }
    const createdFrom = query?.created_at_from || query?.createdAtFrom;
    if (createdFrom) {
      const from = new Date(createdFrom).getTime();
      items = items.filter(
        (r: Role) => new Date(r.createdAt || (r as any).created_at).getTime() >= from
      );
    }
    const createdTo = query?.created_at_to || query?.createdAtTo;
    if (createdTo) {
      const to = new Date(createdTo).getTime();
      items = items.filter(
        (r: Role) => new Date(r.createdAt || (r as any).created_at).getTime() <= to
      );
    }
    // Ordenación
    const sortField = query?.sort_by || query?.sortBy;
    if (sortField) {
      const key = sortField === 'created_at' ? 'createdAt' : sortField;
      const isAsc = (query?.sort_order || query?.sortOrder) === 'asc';
      items.sort((a: any, b: any) => {
        const valA = a[key] ?? a[sortField];
        const valB = b[key] ?? b[sortField];
        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
      });
    }

    const total = items.length;
    const page = (query as any)?.page ?? 1;
    const limit = (query as any)?.limit ?? total;
    const totalPages = Math.ceil(total / limit) || 1;
    const pagedItems = items.slice((page - 1) * limit, page * limit);

    return {
      data: pagedItems,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    } as AllResponse;
  };

  getList = async (_query?: ListQueryParams): Promise<Item[]> => {
    const { data } = await instance.get<any>('/rbac/roles');
    const items = Array.isArray(data) ? data : (data as any)?.data ?? [];
    return items.map(normalizeRole);
  };

  // ==========================================
  // PERMISOS — LECTURA
  // ==========================================

  /**
   * Obtiene los permisos de un rol específico desde FastAPI /rbac/roles/{roleId}
   */
  async getPermissions(roleId: string, _params?: GetPermissionsQuery) {
    const response = await instance.get<any>(`/rbac/roles/${roleId}`);
    const rawPermissions = response.data?.permissions ?? [];
    const permissions = rawPermissions.map((p: any) => ({
      ...p,
      module_code: p.module_code || p.moduleCode || p.module?.code,
      moduleId: p.moduleId || p.module_code || p.moduleCode || p.module?.code,
    }));
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

  async setPermissions(
    roleId: string,
    permissions: RolePermissionItem[] | any[],
    options?: { ifMatch?: string }
  ) {
    const payload = permissions.map((p: any) => ({
      module_code: p.module_code || p.moduleCode || p.module?.code || p.moduleId,
      action: p.action,
      scope: p.scope,
    }));
    const headers: Record<string, string> = {};
    if (options?.ifMatch) {
      headers['If-Match'] = options.ifMatch;
    }
    const response = await instance.put<any>(
      `/rbac/roles/${roleId}/permissions`,
      {
        permissions: payload,
      },
      { headers }
    );
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
    const moduleCode = (data as any).moduleCode || (data as any).module_code || (data as any).moduleId;
    const updated = [
      ...existing.filter(
        (p: any) =>
          !((p.module_code || p.moduleId) === moduleCode && p.action === data.action)
      ),
      {
        module_code: moduleCode,
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
    const updated = existing.filter((p: any) => {
      if (p.id && p.id === permissionId) return false;
      const key = `${p.module_code || p.moduleId}::${p.action}`;
      return key !== permissionId && p.module_code !== permissionId;
    });
    return await this.setPermissions(roleId, updated);
  }

  /**
   * Actualiza el scope de un permiso
   */
  async updatePermissionScope(roleId: string, permissionId: string, data: CreatePermissionBody) {
    const current = await this.getPermissions(roleId);
    const existing = current.data || [];
    const targetCode = (data as any).moduleCode || (data as any).module_code || (data as any).moduleId;
    const updated = existing.map((p: any) => {
      const code = p.module_code || p.moduleId;
      const key = `${code}::${p.action}`;
      if (p.id === permissionId || key === permissionId || (code === targetCode && p.action === data.action)) {
        return {
          module_code: targetCode || code,
          action: data.action || p.action,
          scope: data.scope,
        };
      }
      return {
        module_code: code,
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
    const apiParams = cleanApiParams({
      role_id: roleId,
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...params,
    });

    const response = await instance.get<any>(`/rbac/assignments`, {
      params: apiParams,
    });
    const rawItems = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
    const assignments = rawItems.map(normalizeAssignment);
    return {
      data: assignments as RoleAssignmentResponse[],
      meta: response.data?.meta ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? assignments.length,
        total: assignments.length,
        totalPages: 1,
      },
    };
  }

  async getAssignmentById(roleId: string, assignmentId: string) {
    const response = await instance.get<any>(
      `/rbac/assignments/${assignmentId}`
    );
    return normalizeAssignment(response.data);
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
