import { z } from 'zod';

import { createPaginatedResponseSchema, dateQueryBase } from '@/schemas/crud.schema.js';

export const GetTrashQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  category: z.enum(['entities', 'documents']).default('entities'),
  sort_by: z
    .enum([
      'deleted_at',
      'deletedAt',
      'expires_at',
      'expiresAt',
      'display_name',
      'displayName',
      'name',
      'created_at',
      'createdAt',
    ])
    .optional(),
  sortBy: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
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
  moduleId: z.string().optional(),
  deleted_at_from: dateQueryBase,
  deleted_at_to: dateQueryBase,
  deletedAtFrom: dateQueryBase,
  deletedAtTo: dateQueryBase,
  expires_at_from: dateQueryBase,
  expires_at_to: dateQueryBase,
  expiresAtFrom: dateQueryBase,
  expiresAtTo: dateQueryBase,
});

export const TrashBinItemSchema = z.object({
  id: z.uuidv7(),
  moduleId: z.string().optional(),
  module_id: z.string().optional(),
  moduleSlug: z.string().optional(),
  module_slug: z.string().optional(),
  entity_type: z.string().optional(),
  entityId: z.string().optional(),
  entity_id: z.string().optional(),
  displayName: z.string().optional(),
  display_name: z.string().optional(),
  name: z.string().optional(),
  deletedAt: z.coerce.date().optional(),
  deleted_at: z.union([z.string(), z.date()]).optional(),
  deletedBy: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
  deletedByName: z.string().nullable().optional(),
  deleted_by_name: z.string().nullable().optional(),
  deletedByEmail: z.string().nullable().optional(),
  deleted_by_email: z.string().nullable().optional(),
  deletor: z
    .object({
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  expiresAt: z.coerce.date().optional(),
  expires_at: z.union([z.string(), z.date()]).optional(),
  ownerId: z.string().nullable().optional(),
  owner_id: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  modulePrincipalEntity: z
    .object({
      code: z.string(),
      name: z.string(),
      entity_name: z.string().nullable().optional(),
      entity_id: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const TrashListResponseSchema = createPaginatedResponseSchema(TrashBinItemSchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const BulkResponseSchema = z.object({
  count: z.number(),
});

export type GetTrashQuery = z.infer<typeof GetTrashQuerySchema>;
export type TrashListResponse = z.infer<typeof TrashListResponseSchema>;
export type TrashBinItemS = z.infer<typeof TrashBinItemSchema>;
export type BulkIdsBody = z.infer<typeof BulkIdsBodySchema>;
export type BulkResponse = z.infer<typeof BulkResponseSchema>;
