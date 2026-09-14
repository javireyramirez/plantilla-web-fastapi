import instance from '@/config/api';
import { cleanApiParams } from '@/services/crud.service';

import { GetSettingsQuery, Setting, UpdateSettingBody } from './settings.schema';

function normalizeSetting(s: any): Setting {
  return {
    id: s.id,
    key: s.key,
    value: s.value,
    description: s.description ?? null,
    category: s.category ?? 'system',
    isPublic: s.is_public ?? s.isPublic ?? false,
    version: s.version ?? 1,
    createdAt: s.created_at ? new Date(s.created_at) : s.createdAt,
    updatedAt: s.updated_at ? new Date(s.updated_at) : s.updatedAt,
  };
}

class SettingsService {
  async getAll(query?: GetSettingsQuery): Promise<Setting[]> {
    const params = cleanApiParams(query as Record<string, any>);
    const response = await instance.get<any[]>('/settings', { params });
    const items = Array.isArray(response.data)
      ? response.data
      : (response.data as any)?.data ?? [];
    return items.map(normalizeSetting);
  }

  async getByKey(key: string): Promise<Setting> {
    const response = await instance.get<any>(`/settings/${encodeURIComponent(key)}`);
    return normalizeSetting(response.data);
  }

  async update(key: string, body: UpdateSettingBody): Promise<Setting> {
    const payload: { value: any; description?: string | null } = {
      value: body.value,
    };
    if (body.description !== undefined) {
      payload.description = body.description;
    }
    const response = await instance.patch<any>(
      `/settings/${encodeURIComponent(key)}`,
      payload
    );
    return normalizeSetting(response.data);
  }
}

export const settingsService = new SettingsService();
