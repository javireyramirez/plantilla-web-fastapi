import { z } from 'zod';

import {
  GetListQueryBase,
  GetPaginatedQueryBaseSchema,
  createPaginatedResponseSchema,
} from '@/schemas/crud.schema.js';

export const AuditActionSchema = z.string();

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  actor_id: z.string().nullable().optional(),
  action: AuditActionSchema,
  moduleId: z.string().nullable().optional(),
  moduleSlug: z.string().nullable().optional(),
  entity_type: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  entity_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  createdAt: z.date(),
  created_at: z.union([z.string(), z.date()]).optional(),
  user: z
    .object({
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

// PARAMS
export const AuditLogIdParamsSchema = z.object({
  id: z.string(),
});

// QUERIES
export const GetAuditLogsQuerySchema = GetPaginatedQueryBaseSchema.extend({
  action: AuditActionSchema.optional(),
  entity_type: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  moduleSlug: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  entityId: z.string().optional(),
  entity_id: z.string().optional(),
  actor_id: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  userId: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  user: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  sort_by: z
    .enum([
      'createdAt',
      'created_at',
      'action',
      'moduleSlug',
      'module_slug',
      'entity_type',
      'displayName',
      'entity_name',
      'userId',
      'actor_name',
    ])
    .optional(),
  sortBy: z.string().optional(),
});

export const GetListQuery = GetListQueryBase.extend({
  sort_by: z.string().optional(),
  sortBy: z.string().optional(),
});

// RESPONSES
export const AuditLogResponseSchema = AuditLogSchema;
export const AuditLogsListResponseSchema = createPaginatedResponseSchema(AuditLogSchema);
export const ResponseListSchema = z.array(
  z.object({
    id: z.string(),
    displayName: z.string().nullable().optional(),
    createdAt: z.date(),
  })
);

export type AuditLogType = z.infer<typeof AuditLogSchema>;
export type GetAuditLogsQuery = z.infer<typeof GetAuditLogsQuerySchema>;
export type AuditLogsListResponse = z.infer<typeof AuditLogsListResponseSchema>;
