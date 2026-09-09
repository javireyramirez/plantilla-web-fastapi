import { CalendarIcon, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
import { TeamMemberWithRelations } from '@/modules/teams/model/teams.schema';
import useMembers from '@/modules/teams/model/use-members-table';

import { AddMembersDrawer } from './add-member';

interface MembersTableProps {
  teamId: string;
}

export function MembersTable({ teamId }: MembersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = React.useMemo<ColumnDef<TeamMemberWithRelations>[]>(
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
        accessorFn: (row) => row.user?.name ?? '',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('teamMembers.name')} />
        ),
        cell: ({ row }) => {
          const member = row.original;
          const memberName = member.user?.name ?? member.userId;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7">
                <AvatarFallback>{memberName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">
                {' '}
                <button
                  className="truncate font-medium max-w-xs text-blue-500 hover:text-blue-700 hover:underline text-left"
                  onClick={() => navigate(`/users/edit/${row.original.id}`)}
                >
                  {memberName}
                </button>
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
        id: 'email',
        accessorFn: (row) => row.user?.email ?? '',
        enableColumnFilter: false,
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('teamMembers.email')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm truncate">
            {row.original.user?.email ?? row.original.userId}
          </span>
        ),
      },
      {
        accessorKey: 'joinedAt',
        enableColumnFilter: true,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('teamMembers.table.fecha')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums text-sm">
            {formatDate(row.getValue('joinedAt'))}
          </span>
        ),
        meta: {
          label: t('teamMembers.table.joinedAt'),
          variant: 'dateRange',
          icon: CalendarIcon,
        },
      },
    ],
    [t]
  );

  const {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    memberUserIds,
    handleRemove,
    isPendingActions,
    handleAddMembers,
    isPendingAdd,
  } = useMembers(teamId, columns);

  // Skeleton
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={limit}
        filterCount={2}
        withPagination={true}
      />
    );
  }

  // Tabla
  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">{t('teams.members')}</h2>
        <AddMembersDrawer
          excludeUserIds={memberUserIds}
          onAddMembers={handleAddMembers}
          isAdding={isPendingAdd}
        />
      </div>

      <DataTable
        table={table}
        totalCount={totalRows}
        mobileConfig={{
          primaryColumn: 'name',
          stackedColumns: ['joinedAt'],
        }}
        actionBar={
          <DataTableFloatingBar
            table={table}
            actions={[
              {
                label: t('teamMembers.remove'),
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
