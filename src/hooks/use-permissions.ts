import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import instance from '@/config/api';
import { useSession } from '@/config/auth-client';

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
      if (isSuperAdmin) return true;
      if (!data?.permissions) return false;

      const mod = (moduleCode || '').toLowerCase().trim();
      const modPerms = data.permissions[mod] || data.permissions[moduleCode];
      if (!modPerms) return false;

      return modPerms[action] !== undefined;
    },
    [isSuperAdmin, data?.permissions]
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
