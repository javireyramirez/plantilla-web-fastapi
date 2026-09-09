// @/modules/roles/model/use-role-permissions-matrix.ts
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import * as React from 'react';

import { modulesQueries } from '@/modules/modules/model/modules.query';

import { rolesQueries } from './roles.query';
import { PermissionScopeType } from './roles.schema';

export function useRolePermissionsMatrix(roleId: string) {
  const { t } = useTranslation();

  // 1. Cargamos todos los módulos utilizando tu método genérico optimizado de listas (Retorna array plano)
  const { data: modules = [], isLoading: isLoadingModules } = modulesQueries.useGetList();

  // 2. Cargamos los permisos actuales asignados solucionando el error de tipado de TypeScript
  const { data: permissionsData, isLoading: isLoadingPermissions } = rolesQueries.useGetPermissions(
    roleId,
    {
      page: 1,
      limit: 1000, // Traemos todos para evitar cortes en la matriz
      sortBy: 'grantedAt',
      sortOrder: 'desc',
    }
  );
  const currentPermissions = permissionsData?.data ?? [];

  // 3. Mutaciones de la API
  const addPermissionMutation = rolesQueries.useAddPermission(roleId);
  const revokePermissionMutation = rolesQueries.useRevokePermission(roleId);
  const updateScopeMutation = rolesQueries.useUpdatePermissionScope(roleId, '');

  const isLoading = isLoadingModules || isLoadingPermissions;

  // Helper para buscar si existe un permiso asignado comparando el moduleId
  const getPermissionCell = React.useCallback(
    (moduleId: string, action: string) => {
      return currentPermissions.find((p) => p.moduleId === moduleId && p.action === action);
    },
    [currentPermissions]
  );

  // Pending selection state
  const [pendingEdits, setPendingEdits] = React.useState<Record<string, PermissionScopeType | 'NONE'>>({});
  const [isSaving, setIsSaving] = React.useState(false);


  const getEffectiveScope = React.useCallback(
    (moduleId: string, action: string) => {
      const key = `${moduleId}::${action}`;
      if (key in pendingEdits) {
        return pendingEdits[key];
      }
      const existing = getPermissionCell(moduleId, action);
      return existing ? existing.scope : 'NONE';
    },
    [pendingEdits, getPermissionCell]
  );

  const setPendingScope = React.useCallback(
    (moduleId: string, action: string, newScope: PermissionScopeType | 'NONE') => {
      const key = `${moduleId}::${action}`;
      const existing = getPermissionCell(moduleId, action);
      const originalScope = existing ? existing.scope : 'NONE';

      setPendingEdits((prev) => {
        const next = { ...prev };
        if (newScope === originalScope) {
          delete next[key];
        } else {
          next[key] = newScope;
        }
        return next;
      });
    },
    [getPermissionCell]
  );

  const handleCancel = React.useCallback(() => {
    setPendingEdits({});
  }, []);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      const keys = Object.keys(pendingEdits);
      
      // Perform all mutations in parallel
      const promises = keys.map(async (key) => {
        const [moduleId, action] = key.split('::');
        const newScope = pendingEdits[key];
        const existingPermission = getPermissionCell(moduleId, action);

        if (newScope === 'NONE') {
          if (existingPermission) {
            await revokePermissionMutation.mutateAsync(existingPermission.id);
          }
        } else if (!existingPermission) {
          await addPermissionMutation.mutateAsync({
            moduleId,
            action,
            scope: newScope,
          });
        } else if (existingPermission.scope !== newScope) {
          await updateScopeMutation.mutateAsync({
            ...existingPermission,
            id: existingPermission.id,
            scope: newScope,
            moduleId,
            action,
          } as any);
        }
      });

      await Promise.all(promises);
      setPendingEdits({});
      toast.success(t('roles.permissions.savedAll', { defaultValue: 'Matriz de permisos guardada correctamente' }));
    } catch (error) {
      toast.error(t('roles.permissions.error', { defaultValue: 'Error al modificar los permisos' }));
    } finally {
      setIsSaving(false);
    }
  }, [pendingEdits, getPermissionCell, addPermissionMutation, revokePermissionMutation, updateScopeMutation, t]);

  return {
    modules,
    isLoading,
    getEffectiveScope,
    setPendingScope,
    handleSave,
    handleCancel,
    hasChanges: Object.keys(pendingEdits).length > 0,
    isSaving,
    isMutating:
      addPermissionMutation.isPending ||
      revokePermissionMutation.isPending ||
      updateScopeMutation.isPending ||
      isSaving,
  };
}
