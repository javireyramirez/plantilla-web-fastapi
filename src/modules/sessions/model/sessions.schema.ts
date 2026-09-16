import { z } from 'zod';

import {
  GetPaginatedQueryBaseSchema,
  createPaginatedResponseSchema,
  dateQueryBase,
} from '@/schemas/crud.schema';

export const SessionAdminSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_name: z.string(),
  user_email: z.string(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  is_valid: z.boolean(),
  impersonated_by: z.string().uuid().nullable().optional(),
  is_impersonated: z.boolean().default(false),
  created_at: z.union([z.string(), z.date()]),
  expires_at: z.union([z.string(), z.date()]),
  is_current: z.boolean().default(false),
});

export const GetSessionsQuerySchema = GetPaginatedQueryBaseSchema.extend({
  search: z.string().optional(),
  user_id: z.string().uuid().optional(),
  is_valid: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  expires_at_from: dateQueryBase,
  expires_at_to: dateQueryBase,
  sort_by: z.string().optional(),
});

export const SessionsListResponseSchema = createPaginatedResponseSchema(SessionAdminSchema);

export const BulkIdsRequestSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
});

export const BulkResponseSchema = z.object({
  count: z.number().int().min(0),
  message: z.string().nullable().optional(),
  unprocessed_ids: z.array(z.string().uuid()).optional().default([]),
});

export const MessageResponseSchema = z.object({
  message: z.string(),
  detail: z.string().nullable().optional(),
});

export type SessionAdminType = z.infer<typeof SessionAdminSchema>;
export type GetSessionsQuery = z.infer<typeof GetSessionsQuerySchema>;
export type SessionsListResponse = z.infer<typeof SessionsListResponseSchema>;
export type BulkIdsRequest = z.infer<typeof BulkIdsRequestSchema>;
export type BulkResponse = z.infer<typeof BulkResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
