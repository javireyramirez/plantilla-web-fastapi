import { z } from 'zod';

export const RequestUploadBodySchema = z.object({
  fileData: z.object({
    fileName: z.string().min(1),
    mimeType: z.string().includes('/'),
    size: z.number().positive(),
    isPublic: z.boolean().default(false),
  }),
});

export const GetDocumentsQuerySchema = z.object({
  // --- Paginación ---
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // --- Filtros de Texto y Selección Múltiple ---
  fileName: z.string().optional(),

  // Transformamos un string separado por comas o múltiples queries en un array
  contentTypes: z
    .preprocess((val) => {
      // Si llega como string único, lo convertimos a array
      if (typeof val === 'string') return [val];
      // Si ya es array, lo dejamos como está
      if (Array.isArray(val)) return val;
      // Si es undefined o null, devolvemos undefined
      return undefined;
    }, z.array(z.string()))
    .optional(),

  // --- Filtros de Rango (Números) ---
  sizeMin: z.coerce.number().int().nonnegative().optional(),
  sizeMax: z.coerce.number().int().nonnegative().optional(),

  // --- Filtros de Rango (Fechas) ---
  createdFrom: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),
  createdTo: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),
  deletedFrom: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),
  deletedTo: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),

  // --- Filtros de Usuarios (Múltiples IDs) ---
  createdBy: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      return val;
    }, z.array(z.string()))
    .optional(),

  deletedBy: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      return val;
    }, z.array(z.string()))
    .optional(),

  // --- Estado y Orden ---
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  sortBy: z
    .enum(['fileName', 'createdAt', 'size', 'contentType', 'deletedAt'])
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type RequestUploadParams = z.infer<typeof RequestUploadBodySchema>['fileData'];
export type GetDocumentsQuery = z.infer<typeof GetDocumentsQuerySchema>;
