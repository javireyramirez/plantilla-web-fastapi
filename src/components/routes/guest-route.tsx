import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PropsWithChildren } from 'react';

import { useSession } from '@/config/auth-client.js';

interface GuestRouteProps extends PropsWithChildren {
  redirectTo?: string;
}

function GuestRoute({ redirectTo = '/home' }: GuestRouteProps) {
  const { data: session, isPending, error, isRefetching } = useSession();
  const location = useLocation();
  const { t } = useTranslation();

  if (error) {
    console.error('Error verificando sesión:', error);
    return <Outlet />;
  }

  // if (isPending || isRefetching || (session === undefined && !error)) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <div className="flex flex-col items-center gap-3">
  //         <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
  //         <p className="text-sm text-muted-foreground">{t('nav.verifyingSession')}</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (session) {
    const destination = location.state?.from || redirectTo;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
