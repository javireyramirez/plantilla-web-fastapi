import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import useAdminAccess from '@/hooks/use-admin-access';

export default function AdminRedirect() {
  const { t } = useTranslation();
  const location = useLocation();
  const { hasAdminAccess, firstAdminRoute, isLoading } = useAdminAccess();

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

  if (!hasAdminAccess) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          from: location.pathname,
          reason: 'no_admin_access',
        }}
      />
    );
  }

  return <Navigate to={firstAdminRoute} replace />;
}
