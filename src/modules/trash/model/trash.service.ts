import instance from '@/config/api';

import { BulkIdsBody, BulkResponse, GetTrashQuery, TrashListResponse } from './trash.schema';

class TrashService {
  async getTrash(params?: GetTrashQuery) {
    const response = await instance.get<TrashListResponse>(`/trash`, { params });
    return response.data;
  }

  async bulkRestore(data: BulkIdsBody) {
    const response = await instance.patch<BulkResponse>(`/trash/bulk/restore`, data);
    return response.data;
  }

  async bulkDelete(data: BulkIdsBody) {
    const response = await instance.delete<BulkResponse>(`/trash/bulk/permanent`, {
      data,
    });
    return response.data;
  }
}

export const trashService = new TrashService();
