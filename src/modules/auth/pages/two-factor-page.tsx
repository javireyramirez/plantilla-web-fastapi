import { AlertCircle, KeyRound, LoaderCircle, ShieldAlert, Smartphone } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useTwoFactorSignIn } from '@/hooks/use-auth';
import { clearSigningOut } from '@/lib/auth-flags.js';
import { useTwoFactorStore } from '@/modules/auth/model/two-factor.store';

export default function TwoFactorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const storeToken = useTwoFactorStore((state) => state.twoFactorToken);
  const storeCallbackUrl = useTwoFactorStore((state) => state.callbackUrl);
  const clearChallenge = useTwoFactorStore((state) => state.clearChallenge);

  // Resolver token y callback URL priorizando query params -> history state -> store
  const twoFactorToken =
    searchParams.get('token') ||
    (location.state as any)?.token ||
    storeToken ||
    null;

  const callbackUrl =
    searchParams.get('callback_url') ||
    (location.state as any)?.callbackUrl ||
    storeCallbackUrl ||
    '/companies';

  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const signInMutation = useTwoFactorSignIn();

  useEffect(() => {
    // Si no hay token de desafío disponible, marcar como expirado
    if (!twoFactorToken) {
      setIsExpired(true);
    }
  }, [twoFactorToken]);

  useEffect(() => {
    // Auto-focus en el input al cambiar de modo
    setCode('');
    setInlineError(null);
    inputRef.current?.focus();
  }, [mode]);

  const submitCode = (candidateCode: string) => {
    if (!twoFactorToken) {
      setIsExpired(true);
      return;
    }

    const trimmedCode = candidateCode.trim();

    if (mode === 'totp') {
      if (trimmedCode.length !== 6) {
        setInlineError(t('twoFactor.verifyCodeLength', { defaultValue: 'El código debe tener 6 dígitos' }));
        return;
      }
    } else {
      const stripped = trimmedCode.replace(/-/g, '');
      if (stripped.length !== 8) {
        setInlineError(
          t('twoFactor.recoveryCodeLength', {
            defaultValue: 'El código de recuperación debe tener 8 caracteres',
          })
        );
        return;
      }
    }

    setInlineError(null);

    signInMutation.mutate(
      {
        two_factor_token: twoFactorToken,
        code: trimmedCode,
      },
      {
        onSuccess: () => {
          clearSigningOut();
          clearChallenge();
          toast.success(t('auth.toastSuccessSignIn', { defaultValue: 'Sesión iniciada correctamente' }));
          window.location.href = callbackUrl;
        },
        onError: (err: any) => {
          const status = err.status || err.response?.status;
          const msg = err.message || err.response?.data?.detail;

          if (status === 400 && (msg?.includes('expirado') || msg?.includes('inválido') || msg?.includes('desafío'))) {
            setIsExpired(true);
          } else if (status === 429) {
            setInlineError(
              t('twoFactor.rateLimitError', {
                defaultValue: 'Demasiadas peticiones. Por favor, espera unos instantes antes de volver a intentarlo.',
              })
            );
          } else if (status === 401 || status === 400) {
            setInlineError(
              t('twoFactor.invalidCode', { defaultValue: 'Código incorrecto. Vuelve a intentarlo.' })
            );
          } else {
            setInlineError(msg || t('twoFactor.invalidCode', { defaultValue: 'Código incorrecto. Vuelve a intentarlo.' }));
          }
        },
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInlineError(null);

    if (mode === 'totp') {
      // Filtrar solo dígitos y limitar a 6 caracteres
      const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 6);
      setCode(digitsOnly);
      if (digitsOnly.length === 6 && twoFactorToken && !signInMutation.isPending) {
        submitCode(digitsOnly);
      }
    } else {
      // Formato para código de recuperación (ej. K7X9-M2W4): mayúsculas y permitir guion
      const cleaned = rawVal.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9);
      setCode(cleaned);
      if (cleaned.replace(/-/g, '').length === 8 && twoFactorToken && !signInMutation.isPending) {
        submitCode(cleaned);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    setInlineError(null);

    if (mode === 'totp') {
      const digits = pasted.replace(/\D/g, '').slice(0, 6);
      setCode(digits);
      if (digits.length === 6 && twoFactorToken && !signInMutation.isPending) {
        submitCode(digits);
      }
    } else {
      const formatted = pasted.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9);
      setCode(formatted);
      if (formatted.replace(/-/g, '').length === 8 && twoFactorToken && !signInMutation.isPending) {
        submitCode(formatted);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCode(code);
  };

  // 1. Pantalla cuando el token es inválido o ha expirado (más de 5 minutos o ausente)
  if (isExpired) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-col items-center justify-center gap-3 text-center">
            <Avatar className="size-14">
              <AvatarImage src={logo} alt="Logo de la aplicación" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <ShieldAlert className="size-8" />
            </div>
            <CardTitle className="text-xl font-bold">
              {t('twoFactor.expiredTitle', { defaultValue: 'Sesión de verificación expirada' })}
            </CardTitle>
            <CardDescription className="text-center">
              {t('twoFactor.expiredError', {
                defaultValue:
                  'La sesión de verificación ha expirado o no es válida. Por favor, vuelve a iniciar sesión.',
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" asChild>
              <Link to="/signin">
                {t('twoFactor.backToLogin', { defaultValue: 'Volver a iniciar sesión' })}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 2. Pantalla estándar de verificación 2FA
  const isSubmitting = signInMutation.isPending;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center text-center">
          <Avatar className="size-14 mb-2">
            <AvatarImage src={logo} alt="Logo de la aplicación" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="rounded-full bg-primary/10 p-3 text-primary mb-2">
            {mode === 'totp' ? <Smartphone className="size-6" /> : <KeyRound className="size-6" />}
          </div>
          <CardTitle className="text-xl font-bold">
            {t('twoFactor.pageTitle', { defaultValue: 'Verificación en dos pasos' })}
          </CardTitle>
          <CardDescription className="text-center text-xs">
            {mode === 'totp'
              ? t('twoFactor.pageDescription', {
                  defaultValue: 'Introduce el código de 6 dígitos generado por tu aplicación de autenticación.',
                })
              : t('twoFactor.pageDescriptionRecovery', {
                  defaultValue: 'Introduce uno de tus códigos de recuperación de 8 caracteres para continuar.',
                })}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="two-factor-code-input">
                {mode === 'totp'
                  ? t('twoFactor.inputLabel', { defaultValue: 'Código de autenticación' })
                  : t('twoFactor.recoveryInputLabel', { defaultValue: 'Código de recuperación' })}
              </FieldLabel>
              <Input
                ref={inputRef}
                id="two-factor-code-input"
                name="two-factor-code"
                type="text"
                autoFocus
                autoComplete="one-time-code"
                inputMode={mode === 'totp' ? 'numeric' : 'text'}
                placeholder={mode === 'totp' ? '123456' : 'K7X9-M2W4'}
                value={code}
                onChange={handleInputChange}
                onPaste={handlePaste}
                disabled={isSubmitting}
                className="text-center text-xl tracking-widest font-mono h-12"
                aria-invalid={!!inlineError}
              />
              {inlineError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{inlineError}</span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-10 font-medium" disabled={isSubmitting || !code}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('twoFactor.verifying', { defaultValue: 'Verificando...' })}
                </>
              ) : (
                t('twoFactor.submitButton', { defaultValue: 'Verificar' })
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            {/* Alternador de modo TOTP <-> Código de respaldo */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === 'totp' ? 'recovery' : 'totp')}
              disabled={isSubmitting}
            >
              {mode === 'totp'
                ? t('twoFactor.useRecoveryCode', {
                    defaultValue: '¿No tienes tu teléfono? Usar un código de recuperación',
                  })
                : t('twoFactor.useTotpCode', {
                    defaultValue: 'Usar código de la app autenticadora',
                  })}
            </Button>

            <Button variant="link" size="sm" className="w-full text-xs" asChild>
              <Link to="/signin">
                {t('twoFactor.backToLogin', { defaultValue: 'Volver a iniciar sesión' })}
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
