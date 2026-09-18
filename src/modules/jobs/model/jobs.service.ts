import instance from '@/config/api';
import { cleanApiParams } from '@/services/crud.service';
import {
  JobCancelResponse,
  JobCreateRequest,
  JobDefinition,
  JobRetryResponse,
  JobType,
  JobsListResponse,
} from './jobs.schema';

class JobsService {
  async getJobs(params?: any): Promise<JobsListResponse> {
    const apiParams = cleanApiParams(params);
    const response = await instance.get<any>('/jobs', { params: apiParams });
    const raw = response.data;

    const items = (raw?.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      progress: item.progress ?? 0,
      progress_message: item.progress_message ?? null,
      entity_type: item.entity_type ?? null,
      entity_id: item.entity_id ?? null,
      payload: item.payload ?? null,
      result: item.result ?? null,
      error: item.error ?? null,
      attempts: item.attempts ?? 0,
      max_retries: item.max_retries ?? 3,
      scheduled_at: item.scheduled_at,
      started_at: item.started_at ?? null,
      completed_at: item.completed_at ?? null,
      created_by_id: item.created_by_id ?? null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return {
      data: items,
      meta: {
        page: raw?.meta?.page ?? 1,
        limit: raw?.meta?.limit ?? 20,
        total: raw?.meta?.total ?? 0,
        totalPages: raw?.meta?.total_pages ?? raw?.meta?.totalPages ?? 1,
      },
    };
  }

  async getJobById(id: string): Promise<JobType> {
    const response = await instance.get<any>(`/jobs/${id}`);
    const item = response.data?.data ?? response.data;

    return {
      id: item.id,
      name: item.name,
      status: item.status,
      progress: item.progress ?? 0,
      progress_message: item.progress_message ?? null,
      entity_type: item.entity_type ?? null,
      entity_id: item.entity_id ?? null,
      payload: item.payload ?? null,
      result: item.result ?? null,
      error: item.error ?? null,
      attempts: item.attempts ?? 0,
      max_retries: item.max_retries ?? 3,
      scheduled_at: item.scheduled_at,
      started_at: item.started_at ?? null,
      completed_at: item.completed_at ?? null,
      created_by_id: item.created_by_id ?? null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  async cancelJob(id: string): Promise<JobCancelResponse> {
    const response = await instance.post<JobCancelResponse>(`/jobs/${id}/cancel`);
    return response.data;
  }

  async retryJob(id: string): Promise<JobRetryResponse> {
    const response = await instance.post<JobRetryResponse>(`/jobs/${id}/retry`);
    return response.data;
  }

  async enqueueJob(payload: JobCreateRequest): Promise<JobType> {
    const response = await instance.post<any>('/jobs', payload);
    return response.data?.data ?? response.data;
  }

  async getJobDefinitions(): Promise<JobDefinition[]> {
    const response = await instance.get<any>('/jobs/definitions');
    const raw = response.data;
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : [];
    return items.map((item: any) => ({
      name: item.name,
      title: item.title ?? item.name,
      description: item.description ?? '',
      category: item.category ?? 'system',
      icon: item.icon,
      is_dispatchable: item.is_dispatchable ?? false,
      payload_schema: item.payload_schema ?? null,
    }));
  }
}

export const jobsService = new JobsService();
