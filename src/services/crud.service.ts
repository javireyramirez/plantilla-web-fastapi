import instance from '@/config/api';

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
  format?: 'csv' | 'excel' | 'json';
  sort_by?: string;
  sortBy?: string;
  sort_order?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc';
  is_trash?: boolean;
  isTrash?: boolean;
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
    const { data } = await instance.get<TItem>(`/${this.entityName}/${id}`);
    return data;
  };

  // ── Escritura individual ──────────────────────────────────────

  create = async (body: TCreateBody): Promise<TItem> => {
    const { data } = await instance.post<TItem>(`/${this.entityName}`, body);
    return data;
  };

  update = async (id: TId, body: TUpdateBody): Promise<TItem> => {
    const { data } = await instance.patch<TItem>(`/${this.entityName}/${id}`, body);
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

  softDeleteMany = async (ids: TId[]): Promise<TId[]> => {
    const { data } = await instance.post<TId[]>(`/${this.entityName}/bulk/trash`, { ids });
    return data;
  };

  restoreMany = async (ids: TId[]): Promise<TId[]> => {
    const { data } = await instance.post<TId[]>(`/${this.entityName}/bulk/restore`, { ids });
    return data;
  };

  deletePermanentMany = async (ids: TId[]): Promise<void> => {
    const { data } = await instance.delete<void>(`/${this.entityName}/bulk/permanent`, {
      data: { ids },
    });
    return data;
  };

  // ── Exportación con autodescarga ──────────────────────────────

  export = async (body: ExportRequest<TQuery, TId>): Promise<Blob> => {
    const payload = {
      ...body,
      sort_by: body.sort_by ?? (body.sortBy ? (SORT_VALUE_MAP[body.sortBy] || body.sortBy) : undefined),
      sort_order: body.sort_order ?? body.sortOrder,
      is_trash: body.is_trash ?? body.isTrash,
      filters: body.filters ? cleanApiParams(body.filters as Record<string, any>) : undefined,
    };
    const response = await instance.post<Blob>(`/${this.entityName}/export`, payload, {
      responseType: 'blob',
    });

    // 1. Intentar obtener el nombre del archivo desde las cabeceras HTTP del backend
    const contentDisposition = response.headers['content-disposition'];
    let baseFilename = `${this.entityName}_export`;
    let extension = body.format === 'excel' ? 'xlsx' : body.format || 'csv';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        const fullFilename = filenameMatch[1];
        const lastDotIndex = fullFilename.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          baseFilename = fullFilename.substring(0, lastDotIndex);
          extension = fullFilename.substring(lastDotIndex + 1);
        } else {
          baseFilename = fullFilename;
        }
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

    const filename = `${baseFilename}_${timestamp}.${extension}`;

    // 2. Disparar la descarga del archivo en el navegador
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // 3. Limpiar recursos del DOM
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  };
}
