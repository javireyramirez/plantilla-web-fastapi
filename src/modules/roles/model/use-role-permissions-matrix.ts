import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import * as React from 'react';

import { usePermissions } from '@/hooks/use-permissions';
import { modulesQueries } from '@/modules/modules/model/modules.query';

import { rolesQueries } from './roles.query';
import { PermissionScopeType, RolePermissionItem } from './roles.schema';

export function useRolePermissionsMatrix(roleId: string) {
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();

  // 1. Cargamos todos los módulos y filtramos los activos con acciones configurables
  const { data: rawModules = [], isLoading: isLoadingModules } = modulesQueries.useGetList();

  const modules = React.useMemo(() => {
    return rawModules.filter(
      (m: any) =>
        m.isActive !== false &&
        m.is_active !== false &&
        Array.isArray(m.supportedActions) &&
        m.supportedActions.length > 0
    );
  }, [rawModules]);

  // 2. Cargamos los permisos actuales asignados al rol desde FastAPI
  const { data: permissionsData, isLoading: isLoadingPermissions } = rolesQueries.useGetPermissions(
    roleId,
    {
      page: 1,
      limit: 1000,
      sortBy: 'grantedAt',
      sortOrder: 'desc',
    }
  );
  const currentPermissions = permissionsData?.data ?? [];

  // 3. Mutación atómica para reemplazar todos los permisos
  const setPermissionsMutation = rolesQueries.useSetPermissions(roleId);

  const isLoading = isLoadingModules || isLoadingPermissions;

  // Helper para buscar si existe un permiso asignado comparando el module_code
  const getPermissionCell = React.useCallback(
    (moduleCode: string, action: string) => {
      return currentPermissions.find(
        (p: any) =>
          ((p.module_code || p.moduleId || p.moduleCode) === moduleCode) &&
          p.action === action
      );
    },
    [currentPermissions]
  );

  // Pending selection state
  const [pendingEdits, setPendingEdits] = React.useState<Record<string, PermissionScopeType | 'NONE'>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const getEffectiveScope = React.useCallback(
    (moduleCode: string, action: string) => {
      const key = `${moduleCode}::${action}`;
      if (key in pendingEdits) {
        return pendingEdits[key];
      }
      const existing = getPermissionCell(moduleCode, action);
      return existing ? (existing.scope as PermissionScopeType) : 'NONE';
    },
    [pendingEdits, getPermissionCell]
  );

  const setPendingScope = React.useCallback(
    (moduleCode: string, action: string, newScope: PermissionScopeType | 'NONE') => {
      if (!isSuperAdmin) return;
      const key = `${moduleCode}::${action}`;
      const existing = getPermissionCell(moduleCode, action);
      const originalScope = existing ? (existing.scope as PermissionScopeType) : 'NONE';

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
    [isSuperAdmin, getPermissionCell]
  );

  const handleCancel = React.useCallback(() => {
    setPendingEdits({});
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!isSuperAdmin) {
      toast.error(t('roles.permissions.superAdminRequired', { defaultValue: 'Solo un SuperAdmin puede modificar permisos de roles' }));
      return;
    }
    setIsSaving(true);
    try {
      const permMap = new Map<string, PermissionScopeType>();

      for (const p of currentPermissions) {
        const code = (p as any).module_code || (p as any).moduleId || (p as any).moduleCode;
        if (code && p.action && p.scope) {
          permMap.set(`${code}::${p.action}`, p.scope as PermissionScopeType);
        }
      }

      for (const [key, newScope] of Object.entries(pendingEdits)) {
        if (newScope === 'NONE') {
          permMap.delete(key);
        } else {
          permMap.set(key, newScope);
        }
      }

      const updatedPermissions: RolePermissionItem[] = Array.from(permMap.entries())
        .filter(([key]) => {
          const [moduleCode, action] = key.split('::');
          const mod = modules.find((m: any) => (m.code || m.slug) === moduleCode);
          if (!mod) return true;
          return mod.supportedActions ? mod.supportedActions.includes(action) : true;
        })
        .map(([key, scope]) => {
          const [module_code, action] = key.split('::');
          return {
            module_code,
            action: action as any,
            scope,
          };
        });

      await setPermissionsMutation.mutateAsync(updatedPermissions);
      setPendingEdits({});
      toast.success(t('roles.permissions.savedAll', { defaultValue: 'Matriz de permisos guardada correctamente' }));
    } catch (error) {
      toast.error(t('roles.permissions.error', { defaultValue: 'Error al modificar los permisos' }));
    } finally {
      setIsSaving(false);
    }
  }, [isSuperAdmin, currentPermissions, modules, pendingEdits, setPermissionsMutation, t]);

  return {
    modules,
    isLoading,
    isSuperAdmin,
    canEditPermissions: isSuperAdmin,
    getEffectiveScope,
    setPendingScope,
    handleSave,
    handleCancel,
    hasChanges: isSuperAdmin && Object.keys(pendingEdits).length > 0,
    isSaving,
    isMutating: setPermissionsMutation.isPending || isSaving,
  };
}
