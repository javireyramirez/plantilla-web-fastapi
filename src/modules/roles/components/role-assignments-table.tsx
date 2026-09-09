import { CalendarIcon, Shield, Trash2, Users } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

import { RoleAssignmentResponse } from '../model/roles.schema';
import useRoleAssignments from '../model/use-role-assignments-table';
import { AddRoleAssignmentDrawer } from './add-role-assignment';

interface RoleAssignmentsTableProps {
  roleId: string;
}

export function RoleAssignmentsTable({ roleId }: RoleAssignmentsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = React.useMemo<ColumnDef<RoleAssignmentResponse>[]>(
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
            aria-label={t('teamMembers.table.selectAll')}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('teamMembers.table.selectRow')}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'name',
        // Determina dinámicamente el nombre si es un usuario asignado o un equipo asignado
        accessorFn: (row) => row.assignedUser?.name ?? row.assignedTeam?.name ?? '',
        enableColumnFilter: true,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('teamMembers.name')} />
        ),
        cell: ({ row }) => {
          const assignment = row.original;
          const isTeam = !!assignment.teamId;

          const displayName = isTeam
            ? (assignment.assignedTeam?.name ?? 'Equipo')
            : (assignment.assignedUser?.name ?? assignment.userId ?? 'Usuario');

          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className={cn('h-7 w-7 rounded-md', !isTeam && 'rounded-full')}>
                <AvatarFallback
                  className={isTeam ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                >
                  {isTeam ? <Users className="h-3.5 w-3.5" /> : displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">
                {isTeam ? (
                  <span className="text-foreground">
                    <button
                      className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                      onClick={() => navigate(`/teams/edit/${assignment.teamId}`)}
                    >
                      {displayName}
                    </button>{' '}
                    <span className="text-xs text-muted-foreground">({t('teamMembers.team')})</span>
                  </span>
                ) : (
                  <button
                    className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                    onClick={() => navigate(`/users/edit/${assignment.userId}`)}
                  >
                    {displayName}
                  </button>
                )}
              </span>
            </div>
          );
        },
        meta: {
          label: t('teamMembers.name'),
          variant: 'text',
        },
      },
      {
        id: 'details',
        accessorFn: (row) => row.assignedUser?.email ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('teamMembers.email', { defaultValue: 'Contacto / Detalle' })}
          />
        ),
        cell: ({ row }) => {
          const { assignedUser, teamId } = row.original;
          return (
            <span className="text-muted-foreground text-sm truncate">
              {teamId ? '---' : assignedUser?.email}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('teamMembers.table.fecha', { defaultValue: 'Asignado el' })}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('assignedAt'))}
          </span>
        ),
        meta: {
          label: t('roles.assignments.assignedAt', { defaultValue: 'Fecha Asignación' }),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
    ],
    [t, navigate]
  );

  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    assignedUserIds,
    assignedTeamIds,
    handleRemove,
    isPendingActions,
    handleAddAssignments,
    isPendingAdd,
  } = useRoleAssignments(roleId, columns);

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
            {t('roles.assignments.title', { defaultValue: 'Usuarios y Equipos Asignados' })}
          </h2>
        </div>
        <AddRoleAssignmentDrawer
          excludeUserIds={assignedUserIds}
          excludeTeamIds={assignedTeamIds}
          onAddAssignments={handleAddAssignments}
          isAdding={isPendingAdd}
        />
      </div>

      <DataTable
        table={table}
        totalCount={totalRows}
        mobileConfig={{
          primaryColumn: 'name',
          stackedColumns: ['assignedAt'],
        }}
        actionBar={
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('roles.assignments.removeSelected', { defaultValue: 'Revocar Rol' }),
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
