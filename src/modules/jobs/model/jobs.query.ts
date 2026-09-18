import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import {
  GetJobsQuery,
  JobCancelResponse,
  JobCreateRequest,
  JobDefinition,
  JobRetryResponse,
  JobType,
  JobsListResponse,
} from './jobs.schema';
import { jobsService } from './jobs.service';

export const jobsQueries = {
  useGetAll: (
    query?: GetJobsQuery,
    options?: Omit<UseQueryOptions<JobsListResponse, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<JobsListResponse, Error>({
      queryKey: ['jobs', 'all', query],
      queryFn: () => jobsService.getJobs(query),
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchInterval: (q) => {
        const items = q.state.data?.data;
        const hasActive = items?.some(
          (j) =>
            j.status === 'RUNNING' ||
            (j.status === 'PENDING' && (!j.scheduled_at || new Date(j.scheduled_at).getTime() <= Date.now()))
        );
        return hasActive ? 3000 : false;
      },
      ...options,
    });
  },

  useGetById: (
    id: string,
    options?: Omit<UseQueryOptions<JobType, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<JobType, Error>({
      queryKey: ['jobs', 'detail', id],
      queryFn: () => jobsService.getJobById(id),
      enabled: !!id && (options?.enabled ?? true),
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchInterval: (q) => {
        const job = q.state.data;
        if (!job) return false;
        const isRunning =
          job.status === 'RUNNING' ||
          (job.status === 'PENDING' && (!job.scheduled_at || new Date(job.scheduled_at).getTime() <= Date.now()));
        return isRunning ? 3000 : false;
      },
      ...options,
    });
  },

  useCancel: () => {
    const queryClient = useQueryClient();
    return useMutation<JobCancelResponse, Error, string>({
      mutationFn: (id: string) => jobsService.cancelJob(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      },
    });
  },

  useRetry: () => {
    const queryClient = useQueryClient();
    return useMutation<JobRetryResponse, Error, string>({
      mutationFn: (id: string) => jobsService.retryJob(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      },
    });
  },

  useEnqueue: () => {
    const queryClient = useQueryClient();
    return useMutation<JobType, Error, JobCreateRequest>({
      mutationFn: (payload: JobCreateRequest) => jobsService.enqueueJob(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      },
    });
  },

  useDefinitions: (options?: Omit<UseQueryOptions<JobDefinition[], Error>, 'queryKey' | 'queryFn'>) => {
    return useQuery<JobDefinition[], Error>({
      queryKey: ['jobs', 'definitions'],
      queryFn: () => jobsService.getJobDefinitions(),
      staleTime: 1000 * 60 * 30, // 30 minutes cache
      refetchOnWindowFocus: false,
      ...options,
    });
  },
};
