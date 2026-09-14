import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import instance from '@/config/api';
import { useSession } from '@/config/auth-client';
import { useModules } from '@/modules/modules/model/modules.query';

export type RbacAction =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'EXPORT'
  | 'IMPORT'
  | 'SETTINGS'
  | (string & {});

export interface UserPermissionsMatrixResponse {
  user_id: string;
  is_super_admin: boolean;
  roles: string[];
  permissions: Record<string, Record<string, string>>;
}

export async function fetchMyPermissions(): Promise<UserPermissionsMatrixResponse> {
  const { data } = await instance.get<UserPermissionsMatrixResponse>('/rbac/my-permissions');
  return data;
}

export function usePermissions() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { modules } = useModules();

  const supportedActionsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    modules.forEach((m: any) => {
      const code = (m.code || m.slug || '').toLowerCase().trim();
      if (code && Array.isArray(m.supportedActions)) {
        map.set(code, m.supportedActions);
      }
    });
    return map;
  }, [modules]);

  const { data, isLoading, error } = useQuery<UserPermissionsMatrixResponse>({
    queryKey: ['my-permissions', userId],
    queryFn: fetchMyPermissions,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const isSuperAdmin = Boolean(
    data?.is_super_admin || (session?.user as any)?.isSuperAdmin || (session?.user as any)?.is_super_admin
  );

  const can = useCallback(
    (moduleCode: string, action: RbacAction): boolean => {
      const mod = (moduleCode || '').toLowerCase().trim();
      const supported = supportedActionsMap.get(mod);

      // Si el módulo está registrado y no soporta la acción, nadie puede ejecutarla (ni SuperAdmin)
      if (supported && !supported.includes(action)) {
        return false;
      }

      if (isSuperAdmin) return true;
      if (!data?.permissions) return false;

      const modPerms = data.permissions[mod] || data.permissions[moduleCode];
      if (!modPerms) return false;

      const scope = modPerms[action];
      return scope !== undefined && scope !== 'NONE';
    },
    [isSuperAdmin, data?.permissions, supportedActionsMap]
  );

  return {
    isSuperAdmin,
    roles: data?.roles ?? [],
    permissions: data?.permissions ?? {},
    can,
    isLoading,
    error,
  };
}

export default usePermissions;
