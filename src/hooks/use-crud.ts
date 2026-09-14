import { UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CrudService, ExportRequest } from '@/services/crud.service';

export function createGenericQueries<
  TItem,
  TCreateBody,
  TUpdateBody,
  TQuery,
  TListQuery,
  TId,
  TAllResponse,
>(
  service: CrudService<TItem, TCreateBody, TUpdateBody, TQuery, TListQuery, TId, TAllResponse>,
  queryKey: string
) {
  return {
    // ── Lectura (Queries) ─────────────────────────────────────────

    useGetAll: (
      query?: TQuery,
      options?: Omit<UseQueryOptions<TAllResponse, Error>, 'queryKey' | 'queryFn'>
    ) => {
      return useQuery<TAllResponse, Error>({
        queryKey: [queryKey, 'all', query],
        queryFn: () => service.getAll(query),
        ...options,
      });
    },
    useGetList: (
      query?: TListQuery,
      options?: Omit<UseQueryOptions<TItem[], Error>, 'queryKey' | 'queryFn'>
    ) => {
      return useQuery<TItem[], Error>({
        queryKey: [queryKey, 'list', query],
        queryFn: () => service.getList(query),
        ...options,
      });
    },

    useGetById: (
      id: TId,
      options?: Omit<UseQueryOptions<TItem, Error>, 'queryKey' | 'queryFn'>
    ) => {
      return useQuery<TItem, Error>({
        queryKey: [queryKey, 'detail', id],
        queryFn: () => service.getById(id),
        enabled: !!id && (options?.enabled ?? true),
        ...options,
      });
    },

    // ── Escritura individual (Mutations) ──────────────────────────

    useCreate: () => {
      const queryClient = useQueryClient();
      return useMutation<TItem, Error, TCreateBody>({
        mutationFn: (body) => service.create(body),
        onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });

          if (data?.id) {
            queryClient.setQueryData([queryKey, 'detail', data.id], data);
          }
        },
      });
    },

    useUpdate: () => {
      const queryClient = useQueryClient();
      return useMutation<TItem, Error, { id: TId; body: TUpdateBody }>({
        mutationFn: ({ id, body }) => service.update(id, body),
        onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          queryClient.setQueryData([queryKey, 'detail', variables.id], data);
        },
      });
    },

    // ── Estados y borrado individual (Mutations) ──────────────────

    useSoftDelete: () => {
      const queryClient = useQueryClient();
      return useMutation<TItem, Error, TId>({
        mutationFn: (id) => service.softDelete(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    useRestore: () => {
      const queryClient = useQueryClient();
      return useMutation<TItem, Error, TId>({
        mutationFn: (id) => service.restore(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    useDeletePermanent: () => {
      const queryClient = useQueryClient();
      return useMutation<void, Error, TId>({
        mutationFn: (id) => service.deletePermanent(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    // ── Bulk (Mutations) ──────────────────────────────────────────

    useCreateMany: () => {
      const queryClient = useQueryClient();
      return useMutation<TItem[], Error, TCreateBody[]>({
        mutationFn: (body) => service.createMany(body),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    useSoftDeleteMany: () => {
      const queryClient = useQueryClient();
      return useMutation<TId[], Error, TId[]>({
        mutationFn: (ids) => service.softDeleteMany(ids),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    useRestoreMany: () => {
      const queryClient = useQueryClient();
      return useMutation<TId[], Error, TId[]>({
        mutationFn: (ids) => service.restoreMany(ids),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    useDeletePermanentMany: () => {
      const queryClient = useQueryClient();
      return useMutation<void, Error, TId[]>({
        mutationFn: (ids) => service.deletePermanentMany(ids),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      });
    },

    useExport: () => {
      return useMutation<Blob, Error, ExportRequest<TQuery, TId>>({
        mutationFn: (body) => service.export(body),
      });
    },

    useExportFormats: () => {
      return useQuery<string[], Error>({
        queryKey: [queryKey, 'export-formats'],
        queryFn: () => service.getExportFormats(),
        staleTime: 1000 * 60 * 60,
      });
    },
  };
}
