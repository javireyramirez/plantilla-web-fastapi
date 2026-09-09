import { UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createGenericQueries } from '@/hooks/use-crud';
import {
  BulkCreateAssignmentBody,
  BulkCreatePermissionBody,
  BulkUpdatePermissionBody,
  CreateAssignmentBody,
  CreatePermissionBody,
  GetAssignmentsQuery,
  GetPermissionsQuery,
} from '@/modules/roles/model/roles.schema';

import { rolesService } from './roles.service';

// ==========================================
// QUERY KEYS
// ==========================================

const rolesKeys = {
  all: (teamId: string) => ['teams', teamId, 'members'] as const,
  permissions: (roleId: string, filters?: GetPermissionsQuery) =>
    ['roles', roleId, 'permissions', filters ?? {}] as const,
  assignments: (roleId: string, filters?: GetAssignmentsQuery) =>
    ['roles', roleId, 'assignments', filters ?? {}] as const,
  assignment: (roleId: string, assignmentId: string) =>
    ['roles', roleId, 'assignments', 'detail', assignmentId] as const,
};

export const rolesQueries = {
  ...createGenericQueries(rolesService, 'roles'),

  useGetPermissions: (roleId: string, filters?: GetPermissionsQuery) => {
    return useQuery({
      queryKey: rolesKeys.permissions(roleId, filters),
      queryFn: () => rolesService.getPermissions(roleId, filters),
      enabled: !!roleId,
    });
  },

  useGetAssignments: (roleId: string, filters?: GetAssignmentsQuery) => {
    return useQuery({
      queryKey: rolesKeys.assignments(roleId, filters),
      queryFn: () => rolesService.getAssignments(roleId, filters),
      enabled: !!roleId,
    });
  },

  useGetAssignmentById: (roleId: string, assignmentId: string) => {
    return useQuery({
      queryKey: rolesKeys.assignment(roleId, assignmentId),
      queryFn: () => rolesService.getAssignmentById(roleId, assignmentId),
      enabled: !!roleId && !!assignmentId,
    });
  },

  // ==========================================
  // HOOKS DE ESCRITURA (MUTATIONS) — PERMISOS
  // ==========================================

  useAddPermission: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreatePermissionBody) => rolesService.addPermission(roleId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] });
      },
    });
  },

  useRevokePermission: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (permissionId: string) => rolesService.revokePermission(roleId, permissionId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] });
      },
    });
  },

  useUpdatePermissionScope: (roleId: string, permissionId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreatePermissionBody) =>
        rolesService.updatePermissionScope(roleId, permissionId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] });
      },
    });
  },

  useBulkAddPermissions: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: BulkCreatePermissionBody) => rolesService.bulkAddPermissions(roleId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] });
      },
    });
  },

  useBulkRevokePermissions: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (permissionIds: string[]) =>
        rolesService.bulkRevokePermissions(roleId, permissionIds),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] });
      },
    });
  },

  useBulkUpdatePermissions: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: BulkUpdatePermissionBody) =>
        rolesService.bulkUpdatePermissions(roleId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] });
      },
    });
  },

  // ==========================================
  // HOOKS DE ESCRITURA (MUTATIONS) — ASIGNACIONES
  // ==========================================

  useAssignRole: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateAssignmentBody) => rolesService.assignRole(roleId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'assignments'] });
      },
    });
  },

  useUnassignRole: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (assignmentId: string) => rolesService.unassignRole(roleId, assignmentId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'assignments'] });
      },
    });
  },

  useBulkAssignRole: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: BulkCreateAssignmentBody) => rolesService.bulkAssignRole(roleId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'assignments'] });
      },
    });
  },

  useBulkUnassignRole: (roleId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (assignmentIds: string[]) => rolesService.bulkUnassignRole(roleId, assignmentIds),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'assignments'] });
      },
    });
  },
};
