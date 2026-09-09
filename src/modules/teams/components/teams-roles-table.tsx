import { CalendarIcon, Plus, Shield, Trash2 } from 'lucide-react';
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
import { rolesQueries } from '@/modules/roles/model/roles.query';
import { GetRoleQuery } from '@/modules/roles/model/roles.schema';
import { ResponseTeamRoleBase } from '@/modules/users/model/users.schema';

import useTeamRoles from '../model/use-teams-roles-table';

function useRolesOptions(params: {
  page?: number;
  limit: number;
  isTrash?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  name?: string;
}) {
  const { name, ...rest } = params;
  const { data, isLoading } = rolesQueries.useGetAll({
    page: rest.page ?? 1,
    isTrash: rest.isTrash ?? false,
    ...rest,
    sortBy: rest.sortBy as GetRoleQuery['sortBy'],
    name: name,
  });

  return {
    data:
      data?.data?.map((r: { id: string; name: string }) => ({
        id: r.id,
        name: r.name,
      })) ?? [],
    isLoading,
  };
}

export function TeamsRolesTable({ teamId }: { teamId?: string }) {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);

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
            aria-label={t('users.table.selectTodo')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('users.table.selectFila')}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label={t('roles.name')} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate font-medium max-w-xs text-foreground">
              <button
                className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                onClick={() => navigate(`/roles/edit/${row.original.id}`)}
              >
                {row.getValue('name')}
              </button>
            </span>
          </div>
        ),
        meta: {
          label: t('roles.name'),
          variant: 'text',
        },
      },
      {
        accessorKey: 'assignedAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('users.teams.fecha')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('assignedAt'))}
          </span>
        ),
        meta: {
          label: t('users.table.creacion'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
    ],
    [t, navigate]
  );

  if (!teamId) {
    return <div>Error.</div>;
  }

  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    handleRemove,
    handleAddRoles,
    assignedRoleIds,
    isPendingAdd,
    isPendingActions,
  } = useTeamRoles(columns, teamId);

  const handleApply = React.useCallback(() => {
    handleAddRoles(selectedRoleIds);
    setSelectedRoleIds([]);
  }, [handleAddRoles, selectedRoleIds]);

  const selectorsConfig: SelectorConfig[] = [
    {
      key: 'roles',
      placeholder: t('roles.selectRole', { defaultValue: 'Selecciona un rol' }),
      searchPlaceholder: t('roles.searchRole', { defaultValue: 'Buscar rol...' }),
      emptyMessage: t('roles.noRolesFound', { defaultValue: 'No se encontraron roles' }),
      useGetList: useRolesOptions,
      excludeIds: assignedRoleIds,
      value: selectedRoleIds,
      onChange: setSelectedRoleIds,
    },
  ];

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={limit}
        filterCount={1}
        withPagination={true}
      />
    );
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
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            {t('teams.roles.assignedTitle', { defaultValue: 'Roles Asignados' })}
          </h2>
        </div>
        <AssignmentDrawer
          triggerBtnText={t('teams.roles.assignBtn', { defaultValue: 'Asignar Rol' })}
          triggerIcon={<Plus className="h-4 w-4" />}
          drawerTitle={t('teams.roles.assignTitle', { defaultValue: 'Asignar Roles al Equipo' })}
          drawerDescription={t('teams.roles.assignDescription', {
            defaultValue: 'Selecciona los roles que deseas asignar a este equipo.',
          })}
          selectors={selectorsConfig}
          onApply={handleApply}
          isApplying={isPendingAdd}
          triggerClassName="gap-2"
        />
      </div>

      <DataTable
        table={table}
        totalCount={totalRows}
        mobileConfig={{
          primaryColumn: 'name',
          stackedColumns: [],
        }}
        actionBar={
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('roles.remove'),
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
