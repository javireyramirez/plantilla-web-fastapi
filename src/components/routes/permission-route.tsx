import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PropsWithChildren } from 'react';

import usePermissions, { RbacAction } from '@/hooks/use-permissions';

interface PermissionRouteProps extends PropsWithChildren {
  module?: string;
  action?: RbacAction;
  requiresSuperAdmin?: boolean;
}

export default function PermissionRoute({
  module,
  action = 'READ',
  requiresSuperAdmin = false,
  children,
}: PermissionRouteProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { can, isSuperAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            className="h-8 w-8 animate-spin text-primary"
            aria-label={t('nav.loadingAria')}
          />
          <p className="text-sm text-muted-foreground">{t('nav.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  // 1. Si requiere superadmin y el usuario no lo es
  if (requiresSuperAdmin && !isSuperAdmin) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location.pathname,
          reason: 'requires_super_admin',
        }}
      />
    );
  }

  // 2. Si se especifica un módulo y el usuario no tiene permisos
  if (module && !can(module, action)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location.pathname,
          module,
          action,
          reason: 'missing_permission',
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
