import instance from '@/config/api';

export interface ExportRequest<TQuery = Record<string, unknown>, TId = string> {
  ids?: TId[];
  filters?: TQuery;
  columns?: string[];
  format?: 'csv' | 'excel' | 'json';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
    const { data } = await instance.get<TAllResponse>(`/${this.entityName}/`, { params: query });
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
    const { data } = await instance.post<TItem>(`/${this.entityName}/`, body);
    return data;
  };

  update = async (id: TId, body: TUpdateBody): Promise<TItem> => {
    const { data } = await instance.put<TItem>(`/${this.entityName}/${id}`, body);
    return data;
  };

  // ── Estados y borrado individual ──────────────────────────────

  softDelete = async (id: TId): Promise<TItem> => {
    const { data } = await instance.delete<TItem>(`/${this.entityName}/${id}`);
    return data;
  };

  restore = async (id: TId): Promise<TItem> => {
    const { data } = await instance.patch<TItem>(`/${this.entityName}/${id}/restore`);
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
    const { data } = await instance.delete<TId[]>(`/${this.entityName}/bulk`, { data: { ids } });
    return data;
  };

  restoreMany = async (ids: TId[]): Promise<TId[]> => {
    const { data } = await instance.patch<TId[]>(`/${this.entityName}/bulk/restore`, { ids });
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
    const response = await instance.post<Blob>(`/${this.entityName}/export`, body, {
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
