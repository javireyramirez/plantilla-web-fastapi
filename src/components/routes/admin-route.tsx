import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PropsWithChildren } from 'react';

import { useSession } from '@/config/auth-client.js';
import { isSigningOut } from '@/lib/auth-flags.js';

interface ProtectedRouteProps extends PropsWithChildren {
  redirectTo?: string;
}

function AdminRoute({ redirectTo = '/signin' }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { data: session, isPending, error, isRefetching } = useSession();
  const location = useLocation();

  if (isPending || (session === undefined && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
  if (error || !session) {
    if (isSigningOut()) {
      return <Navigate to={redirectTo} replace />;
    }
    const reason = error ? 'error' : 'unauthorized';
    return <Navigate to={redirectTo} replace state={{ reason, from: location.pathname }} />;
  }

  return <Outlet />;
}

export default AdminRoute;
