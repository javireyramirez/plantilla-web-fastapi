import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import * as React from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  Row,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { useIsMobile } from '@/hooks/use-mobile';

// Ajusta la ruta a tus queries de roles
import { GetAssignmentsQuery, RoleAssignmentResponse } from '../model/roles.schema';
import { rolesQueries } from './roles.query';

export default function useRoleAssignments(
  roleId: string,
  columns: ColumnDef<RoleAssignmentResponse>[]
) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // ── Estados de la Tabla ────────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // ── Paginación y Límites Dinámicos ─────────────────────────────────────────
  const [page, setPage] = React.useState(1);
  const getInitialLimit = () => {
    if (typeof window === 'undefined') return 10;
    return window.innerWidth < 768 ? 5 : 10;
  };
  const [limit, setLimit] = React.useState(getInitialLimit);

  // ── Extracción de Ordenación y Filtros para la API ─────────────────────────
  const [sort] = sorting;
  const sortBy = (sort ? sort.id : 'assignedAt') as GetAssignmentsQuery['sortBy'];
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  // Filtro de rango de fechas (si lo añades en los headers)
  const assignedAtCol = columnFilters.find((f) => f.id === 'assignedAt');
  const [assignedFrom, assignedTo] = Array.isArray(assignedAtCol?.value)
    ? assignedAtCol.value
    : [undefined, undefined];

  // ── Query de React Query ───────────────────────────────────────────────────
  const { data, isLoading, isFetching } = rolesQueries.useGetAssignments(roleId, {
    page,
    limit,
    sortBy,
    sortOrder,
    assignedFrom: assignedFrom ? assignedFrom : undefined,
    assignedTo: assignedTo ? assignedTo : undefined,
  });

  const assignments: RoleAssignmentResponse[] = data?.data ?? [];
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const totalRows: number = data?.meta?.total ?? 0;

  // Recopilar IDs existentes para pasárselos al Selector y excluirlos
  // Como tu asignación puede ser a usuario o a equipo, extraemos ambos sets de IDs
  const assignedUserIds = assignments.map((a) => a.userId).filter(Boolean) as string[];
  const assignedTeamIds = assignments.map((a) => a.teamId).filter(Boolean) as string[];

  // ── Configuración de TanStack Table ────────────────────────────────────────
  const table = useReactTable({
    data: assignments,
    columns,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPage(1);
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;

      if (next.pageSize !== limit) {
        setPage(1);
      } else {
        setPage(next.pageIndex + 1);
      }
      setLimit(next.pageSize);
    },
  });

  // ── Mutaciones (Acciones) ──────────────────────────────────────────────────
  const { mutate: mutateUnassignBulk, isPending: isPendingUnassign } =
    rolesQueries.useBulkUnassignRole(roleId);
  const { mutate: mutateAssignBulk, isPending: isPendingAssignBulk } =
    rolesQueries.useBulkAssignRole(roleId);
  const { mutate: mutateAssignSingle, isPending: isPendingAssignSingle } =
    rolesQueries.useAssignRole(roleId);

  // Acción: Desasignar seleccionados (Remover miembros del Rol)
  const handleRemove = (rows: Row<RoleAssignmentResponse>[]) => {
    const ids = rows.map((row) => row.original.id); // Usamos el ID de la asignación de rol
    mutateUnassignBulk(ids, {
      onSuccess: () => {
        setRowSelection({});
        toast.success(
          t('roles.assignments.removedSuccess', {
            defaultValue: 'Asignaciones removidas correctamente',
          })
        );
      },
      onError: () => {
        toast.error(
          t('roles.assignments.removedError', { defaultValue: 'Error al remover las asignaciones' })
        );
      },
    });
  };

  // Acción: Añadir nuevos miembros (Usuarios o Equipos)
  const handleAddAssignments = (targets: { userId?: string; teamId?: string }[]) => {
    if (targets.length === 0) return;

    if (targets.length === 1) {
      mutateAssignSingle(targets[0], {
        onSuccess: () => {
          toast.success(
            t('roles.assignments.addedSuccess', {
              defaultValue: 'Miembro asignado al rol correctamente',
            })
          );
        },
        onError: () => {
          toast.error(
            t('roles.assignments.addedError', { defaultValue: 'Error al asignar miembro al rol' })
          );
        },
      });
      return;
    }

    mutateAssignBulk(targets, {
      onSuccess: () => {
        toast.success(
          t('roles.assignments.addedManySuccess', {
            defaultValue: 'Miembros asignados en lote correctamente',
          })
        );
      },
      onError: () => {
        toast.error(
          t('roles.assignments.addedError', {
            defaultValue: 'Error al realizar las asignaciones masivas',
          })
        );
      },
    });
  };

  return {
    table,
    totalRows,
    isLoading,
    isFetching,
    isMobile,
    limit,
    assignedUserIds,
    assignedTeamIds,
    handleRemove,
    isPendingActions: isPendingUnassign,
    handleAddAssignments,
    isPendingAdd: isPendingAssignSingle || isPendingAssignBulk,
  };
}
