import instance from '@/config/api';

import { AuditLogType, AuditLogsListResponse, GetAuditLogsQuery } from './audit.schema';

class AuditService {
  async getAudit(params?: GetAuditLogsQuery) {
    const response = await instance.get<AuditLogsListResponse>(`/audit`, { params });
    return response.data;
  }

  async getAuditById(auditId: string) {
    const response = await instance.get<AuditLogType>(`/audit/${auditId}`);
    return response.data;
  }
}

export const auditService = new AuditService();
