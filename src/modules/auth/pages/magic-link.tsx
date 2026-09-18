import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LoaderCircle,
  MailCheck,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import logo from '@/assets/logo.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useRequestMagicLink } from '@/hooks/use-auth';
import { MagicLinkRequestSchema } from '@/modules/auth/model/auth.schema';
import authService from '@/services/auth.service';

interface ErrorState {
  title: string;
  description: string;
  icon: 'invalid' | 'forbidden' | 'rate-limit' | 'generic';
}

// Registro global de tokens consumidos en memoria para evitar que React.StrictMode (doble montaje)
// dispare la petición dos veces y cause 400 Bad Request por token ya consumido.
const consumedTokens = new Set<string>();

export default function MagicLinkVerifyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const callbackUrl = searchParams.get('callback_url') || '/settings';

  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  const requestMutation = useRequestMagicLink();
  const hasFiredRef = useRef(false);

  useEffect(() => {
    // Si no hay token, no realizamos llamada de verificación; dejamos que el usuario introduzca su email
    if (!token) return;

    // Protección estricta contra doble llamada (React 18/19 StrictMode en desarrollo)
    if (hasFiredRef.current || consumedTokens.has(token)) return;
    hasFiredRef.current = true;
    consumedTokens.add(token);

    authService
      .verifyMagicLink({ token })
      .then((res: any) => {
        if (res?.two_factor_required && res?.two_factor_token) {
          navigate(
            `/two-factor?token=${encodeURIComponent(res.two_factor_token)}&callback_url=${encodeURIComponent(callbackUrl)}`,
            { replace: true }
          );
          return;
        }
        // Redirección con reemplazo de historial para recargar sesión y cookies de forma limpia
        window.location.replace(callbackUrl);
      })
      .catch((err: any) => {
        consumedTokens.delete(token);
        const status = err.status || err.response?.status;
        const serverDetail = err.response?.data?.detail || err.message;

        if (status === 400) {
          setErrorState({
            title: t('auth.magicLinkErrorInvalidOrExpired', {
              defaultValue: 'Enlace caducado o ya utilizado',
            }),
            description:
              serverDetail ||
              t('auth.magicLinkErrorInvalidOrExpiredDesc', {
                defaultValue: 'El enlace de acceso es inválido o ha expirado.',
              }),
            icon: 'invalid',
          });
        } else if (status === 403) {
          setErrorState({
            title: t('auth.magicLinkErrorGeneric', { defaultValue: 'Acceso no permitido' }),
            description:
              serverDetail ||
              t('auth.magicLinkErrorInactive', {
                defaultValue: 'Tu cuenta se encuentra suspendida o inactiva. Contacta con soporte.',
              }),
            icon: 'forbidden',
          });
        } else if (status === 429) {
          setErrorState({
            title: t('auth.magicLinkErrorGeneric', { defaultValue: 'Límite de intentos superado' }),
            description:
              serverDetail ||
              t('auth.magicLinkErrorRateLimit', {
                defaultValue: 'Has superado el límite de intentos. Espera unos segundos.',
              }),
            icon: 'rate-limit',
          });
        } else {
          setErrorState({
            title: t('auth.magicLinkErrorGeneric', { defaultValue: 'No pudimos iniciar tu sesión' }),
            description:
              serverDetail ||
              t('auth.magicLinkErrorInvalidOrExpiredDesc', {
                defaultValue: 'El enlace de acceso es inválido o ha expirado.',
              }),
            icon: 'generic',
          });
        }
      });
  }, [token, callbackUrl, t]);

  const handleRequestMagicLink = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = MagicLinkRequestSchema.shape.email.safeParse(emailInput);
    if (!validation.success) {
      setEmailError(validation.error.issues[0]?.message || 'Email inválido');
      return;
    }

    setEmailError(null);

    requestMutation.mutate(
      {
        email: emailInput.trim(),
        callback_url: callbackUrl,
      },
      {
        onSuccess: () => {
          setIsSentSuccess(true);
          toast.success(
            t('auth.magicLinkSentDesc', {
              defaultValue:
                'Si el correo está registrado en la plataforma, recibirás un enlace de acceso en unos instantes. Revisa también tu carpeta de spam.',
            })
          );
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Error al solicitar el enlace');
        },
      }
    );
  };

  // 1. Estado de verificación en progreso (cuando hay token en la URL)
  if (token && !errorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoaderCircle className="size-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">
            {t('auth.magicLinkVerifying', { defaultValue: 'Iniciando sesión de forma segura...' })}
          </p>
        </div>
      </div>
    );
  }

  // 2. Estado de confirmación de envío tras solicitarlo desde esta vista
  if (isSentSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-col items-center justify-center gap-3 text-center">
            <Avatar className="size-14">
              <AvatarImage src={logo} alt="Logo de la aplicación" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <MailCheck className="size-8" />
            </div>
            <CardTitle className="text-xl font-bold">
              {t('auth.magicLinkSentTitle', { defaultValue: '¡Enlace enviado!' })}
            </CardTitle>
            <CardDescription className="text-center">
              {t('auth.magicLinkSentDesc', {
                defaultValue:
                  'Si el correo está registrado en la plataforma, recibirás un enlace de acceso en unos instantes. Revisa también tu carpeta de spam.',
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSentSuccess(false);
                setEmailInput('');
              }}
            >
              {t('auth.sendAnotherMagicLink', { defaultValue: 'Enviar a otro correo' })}
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/signin">
                {t('auth.backToPasswordLogin', { defaultValue: 'Iniciar sesión con contraseña' })}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const renderIcon = () => {
    if (!errorState) return null;
    switch (errorState.icon) {
      case 'forbidden':
        return <ShieldAlert className="size-10 text-destructive" />;
      case 'rate-limit':
        return <Clock className="size-10 text-amber-500" />;
      case 'invalid':
        return <XCircle className="size-10 text-destructive" />;
      default:
        return <AlertCircle className="size-10 text-destructive" />;
    }
  };

  // 3. Vista de formulario para solicitar el enlace (ya sea porque no se proporcionó token o porque expiró)
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center gap-3 text-center">
          <Avatar className="size-14">
            <AvatarImage src={logo} alt="Logo de la aplicación" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>

          {errorState ? (
            <div className="flex flex-col items-center gap-2">
              {renderIcon()}
              <CardTitle className="text-xl font-bold text-destructive">
                {errorState.title}
              </CardTitle>
              <CardDescription className="text-center">{errorState.description}</CardDescription>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <CardTitle className="text-xl font-bold">
                {t('auth.magicLinkTab', { defaultValue: 'Enlace Mágico' })}
              </CardTitle>
              <CardDescription className="text-center">
                Introduce tu correo electrónico para recibir un enlace de acceso directo.
              </CardDescription>
            </div>
          )}
        </CardHeader>

        <form onSubmit={handleRequestMagicLink}>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="magic-link-input-email">{t('auth.email')}</FieldLabel>
              <Input
                id="magic-link-input-email"
                type="email"
                placeholder="m@example.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                disabled={requestMutation.isPending}
                autoComplete="email"
                autoFocus
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={requestMutation.isPending}>
              {requestMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.sendingMagicLink', { defaultValue: 'Enviando enlace...' })}
                </>
              ) : (
                t('auth.sendMagicLink', { defaultValue: 'Enviar enlace mágico' })
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button variant="link" className="w-full" asChild>
              <Link to="/signin">
                {t('auth.backToPasswordLogin', { defaultValue: 'Iniciar sesión con contraseña' })}
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
