import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createGenericQueries } from '@/hooks/use-crud';

import {
  BulkIdsBody,
  BulkResponse,
  GetUserAssignmentsQuery,
  UpdateUserRolesBody,
  UpdateUserTeamsBody,
  UserRolesPaginatedResponse,
  UserTeamsPaginatedResponse,
  Users,
} from './users.schema';
import { usersService } from './users.service';

const keys = {
  all: () => ['users'] as const,
  rolesList: (usersId: string, params?: GetUserAssignmentsQuery) =>
    [...keys.all(), 'roles', usersId, params] as const,
  teamsList: (usersId: string, params?: GetUserAssignmentsQuery) =>
    [...keys.all(), 'teams', usersId, params] as const,
};

export const usersQueries = {
  ...createGenericQueries(usersService, 'users'),

  useResendInvitation: () => {
    return useMutation<Users, Error, string>({
      mutationFn: (usersId) => usersService.resendInvitation(usersId),
    });
  },

  useSuspend: () => {
    const qc = useQueryClient();
    return useMutation<Users, Error, string>({
      mutationFn: (usersId) => usersService.suspend(usersId),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
    });
  },

  useUnsuspend: () => {
    const qc = useQueryClient();
    return useMutation<Users, Error, string>({
      mutationFn: (usersId) => usersService.unsuspend(usersId),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
    });
  },

  useSuspendBulk: () => {
    const qc = useQueryClient();
    return useMutation<BulkResponse, Error, BulkIdsBody>({
      mutationFn: (body) => usersService.suspendBulk(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
    });
  },

  useUnsuspendBulk: () => {
    const qc = useQueryClient();
    return useMutation<BulkResponse, Error, BulkIdsBody>({
      mutationFn: (body) => usersService.unsuspendBulk(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
    });
  },

  // ==========================================
  // ROLES QUERIES & MUTATIONS
  // ==========================================

  useGetRoleAssignments: (usersId: string, params?: GetUserAssignmentsQuery) => {
    return useQuery<UserRolesPaginatedResponse, Error>({
      queryKey: keys.rolesList(usersId, params),
      queryFn: () => usersService.getRoleAssignments(usersId, params),
      enabled: !!usersId, // Evita disparar la query si el ID no está listo
    });
  },

  useAddRoleAssignments: (usersId: string) => {
    const qc = useQueryClient();
    return useMutation<BulkResponse, Error, UpdateUserRolesBody>({
      mutationFn: (body) => usersService.addRoleAssignments(usersId, body),
      onSuccess: () => {
        // Invalida de forma selectiva solo las listas de roles del usuario afectado
        qc.invalidateQueries({ queryKey: [...keys.all(), 'roles', usersId] });
      },
    });
  },

  useRemoveRoleAssignments: (usersId: string) => {
    const qc = useQueryClient();
    return useMutation<BulkResponse, Error, UpdateUserRolesBody>({
      mutationFn: (body) => usersService.removeRoleAssignments(usersId, body),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [...keys.all(), 'roles', usersId] });
      },
    });
  },

  // ==========================================
  // TEAMS QUERIES & MUTATIONS
  // ==========================================

  useGetTeamAssignments: (usersId: string, params?: GetUserAssignmentsQuery) => {
    return useQuery<UserTeamsPaginatedResponse, Error>({
      queryKey: keys.teamsList(usersId, params),
      queryFn: () => usersService.getTeamAssignments(usersId, params),
      enabled: !!usersId,
    });
  },

  useAddTeamAssignments: (usersId: string) => {
    const qc = useQueryClient();
    return useMutation<BulkResponse, Error, UpdateUserTeamsBody>({
      mutationFn: (body) => usersService.addTeamAssignments(usersId, body),
      onSuccess: () => {
        // Invalida de forma selectiva solo las listas de teams del usuario afectado
        qc.invalidateQueries({ queryKey: [...keys.all(), 'teams', usersId] });
      },
    });
  },

  useRemoveTeamAssignments: (usersId: string) => {
    const qc = useQueryClient();
    return useMutation<BulkResponse, Error, UpdateUserTeamsBody>({
      mutationFn: (body) => usersService.removeTeamAssignments(usersId, body),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [...keys.all(), 'teams', usersId] });
      },
    });
  },
};
