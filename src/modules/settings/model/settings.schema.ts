import { z } from 'zod';

export const SettingSchema = z.object({
  id: z.string(),
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional().nullable(),
  category: z.string().default('system'),
  isPublic: z.boolean().default(false),
  version: z.number().optional().default(1),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const UpdateSettingBodySchema = z.object({
  value: z.any(),
  description: z.string().optional().nullable(),
});

export type Setting = z.infer<typeof SettingSchema>;
export type UpdateSettingBody = z.infer<typeof UpdateSettingBodySchema>;

export interface GetSettingsQuery {
  category?: string;
  search?: string;
}
