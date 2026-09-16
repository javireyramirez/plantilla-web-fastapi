import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface UnauthorizedLocationState {
  from?: string;
  module?: string;
  action?: string;
  reason?: string;
}

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as UnauthorizedLocationState) || {};

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] w-full items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-border/80">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <div className="flex justify-center mb-2">
            <Badge variant="destructive" className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
              {t('unauthorized.badge')}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t('unauthorized.title')}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-1">
            {t('unauthorized.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2 text-center">
          <p className="text-sm text-muted-foreground">
            {t('unauthorized.insufficientPermissions')}
          </p>

          {state.from && (
            <div className="rounded-md bg-muted/60 p-3 text-xs text-left space-y-1 font-mono text-muted-foreground border border-border/40">
              <div className="truncate">
                <span className="font-sans font-semibold text-foreground mr-1">
                  {t('unauthorized.attemptedResource')}
                </span>
                {state.from}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground/80">
            {t('unauthorized.contactAdmin')}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('unauthorized.goBack')}
          </Button>
          <Button
            onClick={handleGoHome}
            className="w-full sm:w-auto gap-2"
          >
            <Home className="h-4 w-4" />
            {t('unauthorized.goHome')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
