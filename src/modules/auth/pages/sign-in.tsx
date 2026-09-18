import { Eye, EyeOff, LoaderCircle, MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import logo from '@/assets/logo.png';
import FormFieldWrapper from '@/components/form/form-field-wrapper';
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
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useRequestMagicLink, useSignIn } from '@/hooks/use-auth';
import { clearSigningOut } from '@/lib/auth-flags';
import { cn } from '@/lib/utils';
import OauthButton from '@/modules/auth/components/oauth-button';
import { MagicLinkRequestSchema } from '@/modules/auth/model/auth.schema';
import { useTwoFactorStore } from '@/modules/auth/model/two-factor.store';

interface FormValues {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export default function SignIn() {
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const setTwoFactorChallenge = useTwoFactorStore((state) => state.setChallenge);

  const signInMutation = useSignIn();
  const magicLinkMutation = useRequestMagicLink();

  useEffect(() => {
    clearSigningOut();

    const reason = location.state?.reason;

    if (reason) {
      if (reason === 'unauthorized') {
        toast.info(t('auth.toastUnauthorized'), { id: 'unauthorized-toast' });
      } else if (reason === 'error') {
        toast.error(t('auth.toastSessionError'), { id: 'error-auth-toast' });
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state, t]);

  const form = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const values = form.getValues();
    const emailValidation = MagicLinkRequestSchema.shape.email.safeParse(values.email);

    if (!emailValidation.success) {
      form.setError('email', {
        type: 'manual',
        message: emailValidation.error.issues[0]?.message || 'Email inválido',
      });
      return;
    }

    form.clearErrors('email');

    if (authMode === 'magic-link') {
      magicLinkMutation.mutate(
        {
          email: values.email,
          callback_url: '/settings',
        },
        {
          onSuccess: () => {
            setMagicLinkSent(true);
            toast.success(
              t('auth.magicLinkSentDesc', {
                defaultValue:
                  'Si el correo está registrado en la plataforma, recibirás un enlace de acceso en unos instantes. Revisa también tu carpeta de spam.',
              }),
              { id: 'magic-link-success' }
            );
          },
          onError: (error: any) => {
            toast.error(error?.message || 'Error al solicitar enlace mágico', {
              id: 'magic-link-error',
            });
          },
        }
      );
    } else {
      if (!values.password || values.password.trim().length === 0) {
        form.setError('password', {
          type: 'manual',
          message: 'Se requiere contraseña',
        });
        return;
      }
      form.clearErrors('password');

      signInMutation.mutate(
        {
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe ?? false,
        },
        {
          onSuccess: (response: any) => {
            if (response?.two_factor_required && response?.two_factor_token) {
              const destination = location.state?.from || '/companies';
              setTwoFactorChallenge(response.two_factor_token, destination);
              navigate(
                `/two-factor?token=${encodeURIComponent(response.two_factor_token)}&callback_url=${encodeURIComponent(destination)}`
              );
            } else {
              toast.success(t('auth.toastSuccessSignIn'), { id: 'auth-success' });
            }
          },
          onError: (error: any) => {
            toast.error(error?.message || t('auth.toastErrorSignIN'), { id: 'auth-error' });
            form.resetField('password');
          },
        }
      );
    }
  };

  const isSubmittingPassword = signInMutation.isPending;
  const isSubmittingMagicLink = magicLinkMutation.isPending;
  const isSubmitting = isSubmittingPassword || isSubmittingMagicLink;

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle className="flex flex-col flex-wrap items-center justify-center">
            <Avatar className="size-14">
              <AvatarImage src={logo} alt="Logo de la aplicación" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
          </CardTitle>
          <CardDescription>{t('auth.signInDescription')}</CardDescription>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {/* Pestañas de modo de autenticación */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-sm font-medium text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setMagicLinkSent(false);
                }}
                className={cn(
                  'py-1.5 rounded-md transition-all cursor-pointer',
                  authMode === 'password'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('auth.passwordTab', { defaultValue: 'Contraseña' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('magic-link');
                  setMagicLinkSent(false);
                }}
                className={cn(
                  'py-1.5 rounded-md transition-all cursor-pointer',
                  authMode === 'magic-link'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('auth.magicLinkTab', { defaultValue: 'Enlace Mágico' })}
              </button>
            </div>

            {authMode === 'magic-link' && magicLinkSent ? (
              /* Vista de confirmación de envío de Enlace Mágico */
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <MailCheck className="size-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-base text-foreground">
                    {t('auth.magicLinkSentTitle', { defaultValue: '¡Enlace enviado!' })}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('auth.magicLinkSentDesc', {
                      defaultValue:
                        'Si el correo está registrado en la plataforma, recibirás un enlace de acceso en unos instantes. Revisa también tu carpeta de spam.',
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setMagicLinkSent(false)}
                  >
                    {t('auth.sendAnotherMagicLink', { defaultValue: 'Enviar a otro correo' })}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setAuthMode('password');
                    }}
                  >
                    {t('auth.backToPasswordLogin', { defaultValue: 'Iniciar sesión con contraseña' })}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Campo de Email único y persistente */}
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper fieldState={fieldState}>
                      <FieldLabel htmlFor="email">{t('auth.email')}</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (fieldState.invalid) form.clearErrors('email');
                        }}
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.invalid ? 'email-error' : undefined}
                        autoComplete="email"
                        disabled={isSubmitting}
                      />
                    </FormFieldWrapper>
                  )}
                />

                {authMode === 'password' && (
                  <>
                    {/* Campo de Contraseña */}
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="password">{t('auth.password')}</FieldLabel>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-primary hover:underline"
                          tabIndex={isSubmitting ? -1 : 0}
                        >
                          {t('auth.forgotPassword')}
                        </Link>
                      </div>
                      <div className="relative">
                        <Controller
                          name="password"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <FormFieldWrapper fieldState={fieldState}>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  if (fieldState.invalid) form.clearErrors('password');
                                }}
                                className="pr-10"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                aria-invalid={fieldState.invalid}
                                aria-describedby={fieldState.invalid ? 'password-error' : undefined}
                                autoComplete="current-password"
                                disabled={isSubmitting}
                              />
                            </FormFieldWrapper>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Checkbox Recordarme */}
                    <Controller
                      name="rememberMe"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="rememberMe"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                            <label
                              htmlFor="rememberMe"
                              className="text-sm font-medium cursor-pointer"
                            >
                              {t('auth.rememberMe')}
                            </label>
                          </div>
                          {fieldState.invalid && (
                            <FieldError>{fieldState.error?.message}</FieldError>
                          )}
                        </div>
                      )}
                    />
                  </>
                )}

                {/* Botón de acción principal */}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {authMode === 'magic-link'
                        ? t('auth.sendingMagicLink', { defaultValue: 'Enviando enlace...' })
                        : t('auth.signing')}
                    </>
                  ) : authMode === 'magic-link' ? (
                    t('auth.sendMagicLink', { defaultValue: 'Enviar enlace mágico' })
                  ) : (
                    t('auth.signin')
                  )}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-2">
            {/* Botones OAuth */}
            <OauthButton isSubmitting={isSubmitting} />

            {/* Link de Registro */}
            <Button
              variant="link"
              className="h-auto p-0 text-link hover:text-link-hover hover:underline transition-colors"
              asChild
            >
              <Link to="/signup" tabIndex={isSubmitting ? -1 : 0}>
                {t('auth.notRegister')}
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
