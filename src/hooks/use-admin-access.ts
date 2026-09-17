import { useMemo } from 'react';
import usePermissions from '@/hooks/use-permissions';
import { useModules } from '@/modules/modules/model/modules.query';
import { getModuleRoute } from '@/components/layout/sidebar-routes';

export function useAdminAccess() {
  const { modules, isLoading: isLoadingModules } = useModules();
  const { can, isSuperAdmin, isLoading: isLoadingPermissions } = usePermissions();

  const adminModules = useMemo(() => {
    if (!modules || modules.length === 0) return [];

    return modules
      .filter((mod: any) => {
        const code = (mod.code || mod.slug || '').toLowerCase().trim();
        if (!code) return false;
        // Omitir módulos abstractos/internos
        if (code === 'rbac' || code === 'auth' || code === 'documents') return false;

        // Si requiere superadmin y no lo es, omitir
        const requiresSuperAdmin = mod.requiresSuperAdmin ?? mod.requires_super_admin ?? false;
        if (requiresSuperAdmin && !isSuperAdmin) return false;

        // Solo módulos activos, marcados para navegación y que no sean de negocio
        const isActive = mod.isActive !== false && mod.is_active !== false;
        const showInNav = Boolean(mod.showInNav ?? mod.show_in_nav);
        const categoryKey = (mod.category || 'system').toLowerCase();
        const isNotBusiness = categoryKey !== 'business';

        return isActive && showInNav && isNotBusiness;
      })
      .map((mod: any) => {
        const code = (mod.code || mod.slug || '').toLowerCase().trim();
        const categoryOrder = mod.categoryOrder ?? mod.category_order ?? 99;
        const sortOrder = mod.sortOrder ?? mod.sort_order ?? 0;
        return {
          code,
          categoryOrder,
          sortOrder,
          route: getModuleRoute(code),
        };
      })
      .sort((a: any, b: any) => a.categoryOrder - b.categoryOrder || a.sortOrder - b.sortOrder);
  }, [modules, isSuperAdmin]);

  const accessibleAdminModules = useMemo(() => {
    return adminModules.filter((mod: any) => isSuperAdmin || can(mod.code, 'READ'));
  }, [adminModules, isSuperAdmin, can]);

  const hasAdminAccess = accessibleAdminModules.length > 0;
  const firstAdminRoute = accessibleAdminModules.length > 0 ? accessibleAdminModules[0].route : '/admin/users';

  return {
    hasAdminAccess,
    firstAdminRoute,
    accessibleAdminModules,
    isLoading: isLoadingModules || isLoadingPermissions,
  };
}

export default useAdminAccess;
