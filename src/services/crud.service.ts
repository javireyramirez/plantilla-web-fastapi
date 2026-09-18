import i18n from 'i18next';
import { toast } from 'sonner';

import instance from '@/config/api';
import { trackJob, triggerFileDownload } from '@/modules/jobs/model/job-tracker';
import type { JobType } from '@/modules/jobs/model/jobs.schema';
import type { ImportFormat, ImportUploadOptions } from '@/types/import.types';

const KEY_MAP: Record<string, string> = {
  sortBy: 'sort_by',
  sortOrder: 'sort_order',
  isTrash: 'is_trash',
  isActive: 'is_active',
  isSystem: 'is_system',
  emailVerified: 'email_verified',
  createdAtFrom: 'created_at_from',
  createdAtTo: 'created_at_to',
  deletedAtFrom: 'deleted_at_from',
  deletedAtTo: 'deleted_at_to',
  expiresAtFrom: 'expires_at_from',
  expiresAtTo: 'expires_at_to',
  assignedFrom: 'assigned_from',
  assignedTo: 'assigned_to',
  moduleSlug: 'entity_type',
  moduleId: 'entity_type',
  userId: 'actor_id',
  entityId: 'entity_id',
  displayName: 'entity_name',
};

const SORT_VALUE_MAP: Record<string, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  expiresAt: 'expires_at',
  assignedAt: 'assigned_at',
  emailVerified: 'email_verified',
  isActive: 'is_active',
  isSystem: 'is_system',
  moduleSlug: 'entity_type',
  displayName: 'entity_name',
  userId: 'actor_name',
};

function parseDateValue(val: any): Date | null {
  if (val instanceof Date) return isNaN(val.getTime()) ? null : new Date(val.getTime());
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string' && val.trim()) {
    const trimmed = val.trim();
    if (/^\d{10,}$/.test(trimmed)) {
      const d = new Date(Number(trimmed));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function cleanApiParams(query?: Record<string, any>): Record<string, any> {
  if (!query) return {};
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    const targetKey = KEY_MAP[key] || key;

    const isToDateKey = targetKey.endsWith('_to') || targetKey === 'to_date';
    const isFromDateKey = targetKey.endsWith('_from') || targetKey === 'from_date';

    if (isToDateKey || isFromDateKey) {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        cleaned[targetKey] = value.trim();
        continue;
      }
      const d = parseDateValue(value);
      if (d) {
        cleaned[targetKey] = formatLocalDate(d);
        continue;
      }
    }

    if (value instanceof Date) {
      cleaned[targetKey] = value.toISOString();
    } else if (targetKey === 'sort_by' && typeof value === 'string') {
      cleaned[targetKey] = SORT_VALUE_MAP[value] || value;
    } else if (targetKey === 'actor_id' && Array.isArray(value)) {
      cleaned[targetKey] = value[0];
    } else if (targetKey === 'entity_type' && Array.isArray(value)) {
      cleaned[targetKey] = value.join(',');
    } else {
      cleaned[targetKey] = value;
    }
  }
  return cleaned;
}

export interface ExportRequest<TQuery = Record<string, unknown>, TId = string> {
  ids?: TId[];
  filters?: TQuery;
  columns?: string[];
  format?: 'csv' | 'excel' | 'json' | 'tsv' | 'google_sheets' | string;
  sort_by?: string;
  sortBy?: string;
  sort_order?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc';
  is_trash?: boolean;
  isTrash?: boolean;
  async_job?: boolean;
}

/**
 * Handles the dual response from export endpoints:
 * 1. Asynchronous (HTTP 202 or JSON): parses JobType, shows toast and tracks SSE for auto-download upon completion.
 * 2. Synchronous (HTTP 200 Blob): triggers immediate browser download.
 */
export async function handleDualExportResponse(
  response: any,
  entityName: string,
  format?: string
): Promise<Blob | JobType> {
  const contentType = response.headers?.['content-type'] || '';
  const isJson =
    response.status === 202 ||
    contentType.includes('application/json') ||
    response.data?.type?.includes('application/json');

  if (isJson) {
    const text = response.data instanceof Blob ? await response.data.text() : JSON.stringify(response.data);
    const jobData = (typeof text === 'string' ? JSON.parse(text) : text) as JobType;
    toast.info(
      i18n.t('export.asyncStarted', { defaultValue: 'Generando exportación en segundo plano...' })
    );
    trackJob(jobData.id, {
      onCompleted: (result) => {
        if (result?.download_url) {
          triggerFileDownload(result.download_url, result.filename);
          toast.success(
            i18n.t('export.asyncCompleted', { defaultValue: 'Exportación completada. Descargando archivo...' })
          );
        }
      },
      onFailed: (err) => {
        toast.error(
          err || i18n.t('export.asyncFailed', { defaultValue: 'Error al generar la exportación en segundo plano' })
        );
      },
    });
    return jobData;
  }

  // 1. Obtener el nombre del archivo desde las cabeceras HTTP del backend (SSOT)
  const contentDisposition = response.headers?.['content-disposition'];
  let filename = '';

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  if (!filename) {
    const safeEntity = entityName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const ext =
      format === 'excel'
        ? 'xlsx'
        : format === 'google_sheets' || format === 'tsv'
          ? 'tsv'
          : format || 'csv';
    filename = `${safeEntity}_${timestamp}.${ext}`;
  }

  // 2. Disparar la descarga del archivo en el navegador
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // 3. Limpiar recursos del DOM
  link.remove();
  window.URL.revokeObjectURL(url);

  return response.data;
}

export abstract class CrudService<
  TItem,
  TCreateBody = unknown,
  TUpdateBody = Partial<TCreateBody>,
  TQuery = Record<string, unknown>,
  TListQuery = Record<string, unknown>,
  TId = string,
  TAllResponse = TItem[],
> {
  constructor(protected entityName: string) {}

  // ── Lectura ──────────────────────────────────────────────────

  getAll = async (query?: TQuery): Promise<TAllResponse> => {
    const params = cleanApiParams(query as Record<string, any>);
    const { data } = await instance.get<TAllResponse>(`/${this.entityName}`, { params });
    return data;
  };

  getList = async (query?: TListQuery): Promise<TItem[]> => {
    const { data } = await instance.get<TItem[]>(`/${this.entityName}/list`, { params: query });
    return data;
  };

  getById = async (id: TId): Promise<TItem> => {
    const response = await instance.get<TItem>(`/${this.entityName}/${id}`);
    const data = response.data;
    const etag = response.headers?.etag || response.headers?.ETag;
    if (etag && typeof data === 'object' && data !== null) {
      (data as any)._etag = etag;
    }
    return data;
  };

  // ── Escritura individual ──────────────────────────────────────

  create = async (body: TCreateBody): Promise<TItem> => {
    const { data } = await instance.post<TItem>(`/${this.entityName}`, body);
    return data;
  };

  update = async (id: TId, body: TUpdateBody, options?: { ifMatch?: string }): Promise<TItem> => {
    const ifMatch = options?.ifMatch || (body as any)?._etag;
    const headers: Record<string, string> = {};
    if (ifMatch) {
      headers['If-Match'] = ifMatch;
    }
    const cleanBody =
      typeof body === 'object' && body !== null && '_etag' in (body as any)
        ? { ...(body as any) }
        : body;
    if (typeof cleanBody === 'object' && cleanBody !== null && '_etag' in (cleanBody as any)) {
      delete (cleanBody as any)._etag;
    }
    const response = await instance.patch<TItem>(`/${this.entityName}/${id}`, cleanBody, { headers });
    const data = response.data;
    const etag = response.headers?.etag || response.headers?.ETag;
    if (etag && typeof data === 'object' && data !== null) {
      (data as any)._etag = etag;
    }
    return data;
  };

  // ── Estados y borrado individual ──────────────────────────────

  softDelete = async (id: TId): Promise<TItem> => {
    const { data } = await instance.delete<TItem>(`/${this.entityName}/${id}`);
    return data;
  };

  restore = async (id: TId): Promise<TItem> => {
    const { data } = await instance.post<TItem>(`/${this.entityName}/${id}/restore`);
    return data;
  };

  deletePermanent = async (id: TId): Promise<void> => {
    const { data } = await instance.delete<void>(`/${this.entityName}/${id}/permanent`);
    return data;
  };

  // ── Bulk ──────────────────────────────────────────────────────

  createMany = async (body: TCreateBody[]): Promise<TItem[]> => {
    const { data } = await instance.post<TItem[]>(`/${this.entityName}/bulk`, body);
    return data;
  };

  softDeleteMany = async (ids: TId[]): Promise<any> => {
    const { data } = await instance.post<any>(`/${this.entityName}/bulk/trash`, { ids });
    return data;
  };

  restoreMany = async (ids: TId[]): Promise<any> => {
    const { data } = await instance.post<any>(`/${this.entityName}/bulk/restore`, { ids });
    return data;
  };

  deletePermanentMany = async (ids: TId[]): Promise<any> => {
    const { data } = await instance.delete<any>(`/${this.entityName}/bulk/permanent`, {
      data: { ids },
    });
    return data;
  };

  // ── Exportación con autodescarga ──────────────────────────────

  getExportFormats = async (): Promise<string[]> => {
    const { data } = await instance.get<string[]>(`/${this.entityName}/export/formats`);
    return data;
  };

  export = async (
    body: ExportRequest<TQuery, TId>,
    options?: { async_job?: boolean }
  ): Promise<Blob | JobType> => {
    const isAsync = Boolean(options?.async_job ?? body.async_job);
    const params = isAsync ? { async_job: true } : undefined;

    const payload = {
      ...body,
      columns: body.columns && body.columns.length > 0 ? body.columns : undefined,
      sort_by: body.sort_by ?? (body.sortBy ? (SORT_VALUE_MAP[body.sortBy] || body.sortBy) : undefined),
      sort_order: body.sort_order ?? body.sortOrder,
      is_trash: body.is_trash ?? body.isTrash,
      filters: body.filters ? cleanApiParams(body.filters as Record<string, any>) : undefined,
    };
    delete (payload as any).async_job;

    const response = await instance.post<Blob>(`/${this.entityName}/export`, payload, {
      params,
      responseType: 'blob',
    });

    return handleDualExportResponse(response, this.entityName, body.format);
  };

  // ── Importación con descarga de plantilla y subida ────────────

  downloadImportTemplate = async (format: ImportFormat = 'excel'): Promise<Blob> => {
    const response = await instance.get<Blob>(`/${this.entityName}/import-template`, {
      params: { format },
      responseType: 'blob',
    });

    const contentDisposition = response.headers?.['content-disposition'];
    let filename = '';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    if (!filename) {
      const safeEntity = this.entityName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = format === 'excel' ? 'xlsx' : 'csv';
      filename = `plantilla_${safeEntity}.${ext}`;
    }

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  };

  uploadImport = async (file: File, options?: ImportUploadOptions): Promise<JobType> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', options?.mode ?? 'atomic');
    formData.append('dry_run', String(options?.dryRun ?? false));

    const response = await instance.post<any>(`/${this.entityName}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data ?? response.data;
  };
}
