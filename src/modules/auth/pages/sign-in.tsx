import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect, useState } from 'react';

import logo from '@/assets/logo.png';
import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.js';
import { Button } from '@/components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.js';
import { Checkbox } from '@/components/ui/checkbox.js';
import { FieldError, FieldLabel } from '@/components/ui/field.js';
import { Input } from '@/components/ui/input.js';
import { useSignIn } from '@/hooks/use-auth.js';
import { clearSigningOut } from '@/lib/auth-flags.js';
import OauthButton from '@/modules/auth/components/oauth-button.js';
import { SignInSchema } from '@/modules/auth/model/auth.schema.js';
import { SignInValues } from '@/modules/auth/model/auth.schema.js';

export default function SignIn() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const signInMutation = useSignIn();

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

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = (data: SignInValues) => {
    signInMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth.toastSuccessSignIn'), { id: 'auth-success' });
        // No navegamos manualmente: GuestRoute detecta la sesión y redirige a
      },
      onError: (error) => {
        toast.error(error?.message || t('auth.toastErrorSignIN'), { id: 'auth-error' });
        form.resetField('password');
      },
    });
  };

  const isSubmitting = signInMutation.isPending;

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

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Campo de Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel htmlFor="email">{t('auth.email')}</FieldLabel>
                    <Input
                      {...field}
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
                      <label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
                        {t('auth.rememberMe')}
                      </label>
                    </div>
                    {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                  </div>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-2 mt-4">
            {/* Botón de Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.signing')}
                </>
              ) : (
                t('auth.signin')
              )}
            </Button>

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
