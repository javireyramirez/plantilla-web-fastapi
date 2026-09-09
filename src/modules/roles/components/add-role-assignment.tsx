import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as React from 'react';

import { AssignmentDrawer, SelectorConfig } from '@/components/selector/assignment-drawer';
import { teamsQueries } from '@/modules/teams/model/teams.query';
import { GetTeamQuery } from '@/modules/teams/model/teams.schema';
import { usersQueries } from '@/modules/users/model/users.query';
import { GetUsersQuery } from '@/modules/users/model/users.schema';

interface AddRoleAssignmentDrawerProps {
  excludeUserIds: string[];
  excludeTeamIds: string[];
  onAddAssignments: (targets: { userId?: string; teamId?: string }[]) => void;
  isAdding?: boolean;
}

function useUsersOptions(params: {
  page?: number;
  limit: number;
  isTrash?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  name?: string;
}) {
  const { name, ...rest } = params;
  const { data, isLoading } = usersQueries.useGetAll({
    page: rest.page ?? 1,
    isTrash: rest.isTrash ?? false,
    ...rest,
    sortBy: rest.sortBy as GetUsersQuery['sortBy'],
    name: name,
  });

  return {
    data:
      data?.data?.map((u: { id: string; name?: string | null; email?: string | null }) => ({
        id: u.id,
        name: u.name ?? u.email ?? u.id,
      })) ?? [],
    isLoading,
  };
}

function useTeamsOptions(params: {
  page?: number;
  limit: number;
  isTrash?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  name?: string;
}) {
  const { name, ...rest } = params;
  const { data, isLoading } = teamsQueries.useGetAll({
    page: rest.page ?? 1,
    isTrash: rest.isTrash ?? false,
    ...rest,
    sortBy: rest.sortBy as GetTeamQuery['sortBy'],
    name: name,
  });

  return {
    data:
      data?.data?.map((t: { id: string; name: string }) => ({
        id: t.id,
        name: t.name,
      })) ?? [],
    isLoading,
  };
}

export function AddRoleAssignmentDrawer({
  excludeUserIds,
  excludeTeamIds,
  onAddAssignments,
  isAdding,
}: AddRoleAssignmentDrawerProps) {
  const { t } = useTranslation();
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<string[]>([]);

  const handleApply = React.useCallback(() => {
    const targets: { userId?: string; teamId?: string }[] = [];
    selectedUserIds.forEach((id) => targets.push({ userId: id }));
    selectedTeamIds.forEach((id) => targets.push({ teamId: id }));
    onAddAssignments(targets);
    setSelectedUserIds([]);
    setSelectedTeamIds([]);
  }, [onAddAssignments, selectedUserIds, selectedTeamIds]);

  const selectorsConfig: SelectorConfig[] = [
    {
      key: 'users',
      label: t('roles.assignments.selectUsersLabel', { defaultValue: 'Usuarios' }),
      placeholder: t('teamMembers.selectUser'),
      searchPlaceholder: t('teamMembers.searchUser'),
      emptyMessage: t('teamMembers.noUsersFound'),
      useGetList: useUsersOptions,
      excludeIds: excludeUserIds,
      value: selectedUserIds,
      onChange: setSelectedUserIds,
    },
    {
      key: 'teams',
      label: t('roles.assignments.selectTeamsLabel', { defaultValue: 'Equipos' }),
      placeholder: t('teams.selectTeam', { defaultValue: 'Selecciona un equipo' }),
      searchPlaceholder: t('teams.searchTeam', { defaultValue: 'Buscar equipo...' }),
      emptyMessage: t('teams.noTeamsFound', { defaultValue: 'No se encontraron equipos' }),
      useGetList: useTeamsOptions,
      excludeIds: excludeTeamIds,
      value: selectedTeamIds,
      onChange: setSelectedTeamIds,
    },
  ];

  return (
    <AssignmentDrawer
      triggerBtnText={t('roles.assignments.addBtn', { defaultValue: 'Asignar Miembro' })}
      triggerIcon={<UserPlus className="h-4 w-4" />}
      drawerTitle={t('roles.assignments.addTitle', { defaultValue: 'Asignar miembros al Rol' })}
      drawerDescription={t('roles.assignments.addDescription', {
        defaultValue: 'Selecciona los usuarios y/o equipos a los que deseas otorgar los permisos de este rol.',
      })}
      selectors={selectorsConfig}
      onApply={handleApply}
      isApplying={isAdding}
      triggerClassName="gap-2"
    />
  );
}
