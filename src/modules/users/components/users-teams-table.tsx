import { CalendarIcon, Plus, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFloatingBar } from '@/components/data-table/data-table-floating-bar';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar-desktop';
import { DataTableToolbarMobile } from '@/components/data-table/data-table-toolbar-mobile';
import { AssignmentDrawer, SelectorConfig } from '@/components/selector/assignment-drawer';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { teamsQueries } from '@/modules/teams/model/teams.query';
import { GetTeamQuery } from '@/modules/teams/model/teams.schema';

import useTableTeams from '../model/use-users-teams-table';
import { ResponseTeamRoleBase } from '../model/users.schema';

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

export function UsersTeamsTable({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<string[]>([]);

  const columns = React.useMemo<ColumnDef<ResponseTeamRoleBase>[]>(
    () => [
      {
        id: 'select',
        maxSize: 40,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('users.teams.selectAll')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('users.teams.selectRow')}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.teams.name')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            <button
              className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
              onClick={() => navigate(`/teams/edit/${row.original.id}`)}
            >
              {row.getValue('name')}
            </button>
          </span>
        ),
        meta: {
          label: t('users.teams.name'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'joinedAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.teams.fecha')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('joinedAt'))}
          </span>
        ),
        meta: {
          label: t('users.table.creacion'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
    ],
    [t]
  );

  if (!userId) {
    return <div>Error.</div>;
  }

  const {
    table,
    isLoading,
    isFetching,
    isMobile,
    handleRemove,
    handleAddTeams,
    assignedTeamIds,
    isPendingAdd,
    isPendingActions,
  } = useTableTeams(columns, userId);

  const handleApply = React.useCallback(() => {
    handleAddTeams(selectedTeamIds);
    setSelectedTeamIds([]);
  }, [handleAddTeams, selectedTeamIds]);

  const selectorsConfig: SelectorConfig[] = [
    {
      key: 'teams',
      placeholder: t('teams.selectTeam', { defaultValue: 'Selecciona un equipo' }),
      searchPlaceholder: t('teams.searchTeam', { defaultValue: 'Buscar equipo...' }),
      emptyMessage: t('teams.noTeamsFound', { defaultValue: 'No se encontraron equipos' }),
      useGetList: useTeamsOptions,
      excludeIds: assignedTeamIds,
      value: selectedTeamIds,
      onChange: setSelectedTeamIds,
    },
  ];

  if (isLoading) {
    return <DataTableSkeleton columnCount={columns.length} rowCount={5} withPagination={false} />;
  }

  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            {t('users.teams.assignedTitle', { defaultValue: 'Equipos Asignados' })}
          </h2>
        </div>
        <AssignmentDrawer
          triggerBtnText={t('users.teams.assignBtn', { defaultValue: 'Asignar Equipo' })}
          triggerIcon={<Plus className="h-4 w-4" />}
          drawerTitle={t('users.teams.assignTitle', { defaultValue: 'Asignar Equipos al Usuario' })}
          drawerDescription={t('users.teams.assignDescription', {
            defaultValue: 'Selecciona los equipos a los que deseas agregar este usuario.',
          })}
          selectors={selectorsConfig}
          onApply={handleApply}
          isApplying={isPendingAdd}
          triggerClassName="gap-2"
        />
      </div>

      <DataTable
        table={table}
        mobileConfig={{ primaryColumn: 'name', stackedColumns: [] }}
        actionBar={
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('users.teams.remove'),
                icon: <Trash2 className="h-4 w-4" />,
                variant: 'destructive',
                disabled: isPendingActions,
                onClick: (rows) => handleRemove(rows),
              },
            ]}
          />
        }
      >
        {isMobile ? <DataTableToolbarMobile table={table} /> : <DataTableToolbar table={table} />}
      </DataTable>
    </div>
  );
}
