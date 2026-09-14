import { z } from 'zod';

import {
  GetListQueryBase,
  ResponseListSchemaBase,
  recordStatusSchema,
} from '@/schemas/crud.schema';

const PermissionAction = {
  READ: 'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  SETTINGS: 'SETTINGS',
};

const PermissionScope = {
  GLOBAL: 'GLOBAL',
  TEAM: 'TEAM',
  OWN: 'OWN',
};

// ==========================================
// ENUMS
// ==========================================

export const permissionScopeSchema = z.enum(PermissionScope);
export const permissionActionSchema = z.enum(PermissionAction);

// ==========================================
// BASE SCHEMAS
// ==========================================

export const RolePermissionItemSchema = z.object({
  module_code: z.string(),
  action: permissionActionSchema,
  scope: permissionScopeSchema.default('OWN'),
});

export const RoleSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  isSystem: z.boolean().default(false),
  is_system: z.boolean().default(false),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  status: recordStatusSchema.optional().default('ACTIVE'),
  permissions: z.array(RolePermissionItemSchema).optional().default([]),
  // Auditoría
  createdAt: z.date(),
  created_at: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.date(),
  updated_at: z.union([z.string(), z.date()]).optional(),
  deletedAt: z.date().optional().nullable(),
  deleted_at: z.union([z.string(), z.date()]).optional().nullable(),
  restoreAt: z.date().optional().nullable(),
  restoredAt: z.date().optional().nullable(),
  restored_at: z.union([z.string(), z.date()]).optional().nullable(),
  createdBy: z.string().optional().nullable(),
  created_by: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  deleted_by: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
});

export const RolePermissionSchema = z.object({
  id: z.string().optional(),
  roleId: z.string().optional(),
  moduleId: z.string().optional(),
  module_code: z.string().optional(),
  action: permissionActionSchema,
  scope: permissionScopeSchema.default('OWN'),
  grantedAt: z.date().optional(),
  grantedBy: z.string().optional().nullable(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional().nullable(),
});

export const RoleAssignmentSchema = z.object({
  id: z.uuidv7(),
  roleId: z.uuidv7(),
  userId: z.uuidv7().optional().nullable(),
  teamId: z.uuidv7().optional().nullable(),
  assignedAt: z.date(),
  assignedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================

export const IdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const RoleIdParamsSchema = z.object({
  roleId: z.uuidv7(),
});

export const RolePermissionIdParamsSchema = z.object({
  roleId: z.uuidv7(),
  id: z.uuidv7(),
});

export const PermissionScopeParamsSchema = z.object({
  newScope: permissionScopeSchema,
});

export const AssignmentIdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const RoleAssignmentParamsSchema = z.object({
  roleId: z.uuidv7(),
  id: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetRoleQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  is_trash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  name: z.string().optional(),
  created_at_from: z.coerce.date().optional(),
  created_at_to: z.coerce.date().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
  is_system: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isSystem: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  sort_by: z.string().optional(),
  sortBy: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetListQuery = GetListQueryBase;

export const GetPermissionsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  sortBy: z.string().optional().default('grantedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Filtros de RBAC (se mapea a moduleId en el service)
  resource: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string()).optional()
  ),
  action: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string()).optional()
  ),
  scope: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string()).optional()
  ),

  grantedFrom: z.string().datetime().optional(),
  grantedTo: z.string().datetime().optional(),
});

export const GetAssignmentsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  sortBy: z.string().optional().default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  userId: z.string().optional(),
  teamId: z.string().optional(),

  assignedFrom: z.date().optional(),
  assignedTo: z.date().optional(),
});

// ==========================================
// BODIES
// ==========================================

export const CreateRoleBodySchema = RoleSchema.omit({
  id: true,
  isSystem: true,
  is_system: true,
  status: true,
  createdAt: true,
  created_at: true,
  updatedAt: true,
  updated_at: true,
  deletedAt: true,
  deleted_at: true,
  restoreAt: true,
  restoredAt: true,
  restored_at: true,
  createdBy: true,
  created_by: true,
  deletedBy: true,
  deleted_by: true,
  restoreBy: true,
  updatedBy: true,
  updated_by: true,
  permissions: true,
});

export const UpdateRoleBodySchema = CreateRoleBodySchema.partial();

export const BulkCreateRoleBodySchema = z.array(CreateRoleBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const CreatePermissionBodySchema = z.object({
  scope: permissionScopeSchema,
  action: permissionActionSchema,
  moduleId: z.uuidv7(),
});

export const BulkCreatePermissionBodySchema = z.array(CreatePermissionBodySchema);

export const BulkUpdatePermissionBodySchema = z.array(
  z.object({
    id: z.uuidv7(),
    scope: permissionScopeSchema,
  })
);

export const CreateAssignmentBodySchema = z
  .object({
    userId: z.uuidv7().optional().nullable(),
    teamId: z.uuidv7().optional().nullable(),
  })
  .refine((data) => data.userId || data.teamId, {
    message: 'Se debe especificar al menos un destinatario: userId, teamId',
  });

export const BulkCreateAssignmentBodySchema = z.array(CreateAssignmentBodySchema);

export const BulkAssignmentIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

// ==========================================
// RESPONSES
// ==========================================

export const RoleResponseSchema = RoleSchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const RoleListResponseSchema = z.object({
  data: z.array(RoleSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const RoleDeletedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const BulkResponseSchema = z.object({
  count: z.number(),
});

export const RolePermissionResponseSchema = RolePermissionSchema.extend({
  granter: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
  updater: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
});

export const RolePermissionsListResponseSchema = z.object({
  data: z.array(RolePermissionResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
});

export const RoleAssignmentResponseSchema = RoleAssignmentSchema.extend({
  granter: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
  assignedUser: z
    .object({ id: z.string(), name: z.string(), email: z.string() })
    .optional()
    .nullable(),
  assignedTeam: z.object({ id: z.string(), name: z.string() }).optional().nullable(),
  role: z.object({ id: z.string(), name: z.string(), slug: z.string() }).optional().nullable(),
});

export const AssignmentListResponseSchema = z.object({
  data: z.array(RoleAssignmentResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
});

export const BulkAssignmentResponseSchema = z.object({
  count: z.number(),
});

// ==========================================
// TYPES
// ==========================================

export type Role = z.infer<typeof RoleSchema>;
export type CreateRole = z.infer<typeof CreateRoleBodySchema>;
export type UpdateRole = z.infer<typeof UpdateRoleBodySchema>;
export type GetListQueryType = z.infer<typeof GetListQuery>;
export type GetRoleQuery = z.infer<typeof GetRoleQuerySchema>;
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>;
export type RoleResponse = z.infer<typeof RoleResponseSchema>;

export type GetPermissionsQuery = z.infer<typeof GetPermissionsQuerySchema>;
export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>;
export type BulkCreatePermissionBody = z.infer<typeof BulkCreatePermissionBodySchema>;
export type BulkUpdatePermissionBody = z.infer<typeof BulkUpdatePermissionBodySchema>;
export type RolePermission = z.infer<typeof RolePermissionResponseSchema>;
export type RolePermissionItem = z.infer<typeof RolePermissionItemSchema>;
export type PermissionScopeParams = z.infer<typeof PermissionScopeParamsSchema>;
export type PermissionScopeType = z.infer<typeof permissionScopeSchema>;

export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;
export type RoleAssignmentResponse = z.infer<typeof RoleAssignmentResponseSchema>;
export type CreateAssignmentBody = z.infer<typeof CreateAssignmentBodySchema>;
export type BulkCreateAssignmentBody = z.infer<typeof BulkCreateAssignmentBodySchema>;
export type GetAssignmentsQuery = z.infer<typeof GetAssignmentsQuerySchema>;
