import { z } from 'zod';

import {
  GetPaginatedQueryBaseSchema,
  createPaginatedResponseSchema,
} from '@/schemas/crud.schema';

export const JobStatusEnumSchema = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const JobSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: JobStatusEnumSchema,
  progress: z.number().int().min(0).max(100).default(0),
  progress_message: z.string().nullable().optional(),
  entity_type: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  payload: z.record(z.string(), z.any()).nullable().optional(),
  result: z.record(z.string(), z.any()).nullable().optional(),
  error: z.string().nullable().optional(),
  attempts: z.number().int().default(0),
  max_retries: z.number().int().default(3),
  scheduled_at: z.union([z.string(), z.date()]),
  started_at: z.union([z.string(), z.date()]).nullable().optional(),
  completed_at: z.union([z.string(), z.date()]).nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
});

export const JobCreateRequestSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  payload: z.record(z.string(), z.any()).optional(),
  entity_type: z.string().max(50).optional(),
  entity_id: z.string().uuid().optional(),
  max_retries: z.number().int().min(0).max(10).default(3),
  lease_duration_seconds: z.number().int().min(10).max(3600).default(300),
  scheduled_at: z.string().optional(),
  idempotency_key: z.string().max(100).optional(),
});

export const JobCancelResponseSchema = z.object({
  id: z.string(),
  status: JobStatusEnumSchema,
  message: z.string(),
});

export const JobRetryResponseSchema = z.object({
  id: z.string(),
  status: JobStatusEnumSchema,
  message: z.string(),
});

export const GetJobsQuerySchema = GetPaginatedQueryBaseSchema.extend({
  status: JobStatusEnumSchema.optional(),
  search: z.string().optional(),
  name: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'scheduled_at', 'started_at', 'completed_at', 'name', 'status', 'progress'])
    .optional(),
});

export const JobsListResponseSchema = createPaginatedResponseSchema(JobSchema);

export type JobType = z.infer<typeof JobSchema>;
export type JobCreateRequest = z.infer<typeof JobCreateRequestSchema>;
export type JobCancelResponse = z.infer<typeof JobCancelResponseSchema>;
export type JobRetryResponse = z.infer<typeof JobRetryResponseSchema>;
export type GetJobsQuery = z.infer<typeof GetJobsQuerySchema>;
export type JobsListResponse = z.infer<typeof JobsListResponseSchema>;
