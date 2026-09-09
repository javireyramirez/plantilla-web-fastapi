import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
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
import { FieldLabel } from '@/components/ui/field.js';
import { Input } from '@/components/ui/input.js';
import { useResetPassword } from '@/hooks/use-auth.js';
import { ResetPasswordSchema } from '@/modules/auth/model/auth.schema.js';
import { ResetPasswordSchemaValues } from '@/modules/auth/model/auth.schema.js';

export default function ResetPassword() {
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const useResetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordSchemaValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      toast.error(t('auth.unauthorizedReset'), { id: 'unauthorized-toast' });
      navigate('/signin', { replace: true });
    } else {
      setIsValidating(false);
    }
  }, [token, navigate]);

  if (isValidating) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) return null;

  const toggleVisibility = (field: 'newPassword' | 'confirmPassword') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = (data: ResetPasswordSchemaValues) => {
    useResetPasswordMutation.mutate(
      { newPassword: data.newPassword, token: token },
      {
        onSuccess: () => {
          toast.success(t('auth.toastSuccessReset'));
          navigate('/signin');
        },

        onError: (error) => {
          toast.error(error?.message || t('auth.toastErrorReset'));
        },
      }
    );
  };

  const isSubmitting = useResetPasswordMutation.isPending;

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle className="flex flex-col flex-wrap items-center justify-center">
            <Avatar className="size-14">
              <AvatarImage src={logo} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
          </CardTitle>
          <CardDescription>{t('auth.changePassword')}</CardDescription>
        </CardHeader>
        <form id="form-signin" autoComplete="off" onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldWrapper fieldState={fieldState}>
                  <FieldLabel htmlFor="newPassword">{t('auth.newPassword')}</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      className="pr-10"
                      id="newPassword"
                      type={showPassword.newPassword ? 'text' : 'password'}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? 'newPassword-error' : undefined}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility('newPassword')}
                      disabled={isSubmitting}
                      aria-label={
                        showPassword.newPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                      }
                    >
                      {showPassword.newPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </FormFieldWrapper>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldWrapper fieldState={fieldState}>
                  <FieldLabel htmlFor="confirmPassword">{t('auth.confirmPassword')}</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      className="pr-10"
                      id="confirmPassword"
                      type={showPassword.confirmPassword ? 'text' : 'password'}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? 'confirmPassword-error' : undefined}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility('confirmPassword')}
                      disabled={isSubmitting}
                      aria-label={
                        showPassword.confirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                      }
                    >
                      {showPassword.confirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </FormFieldWrapper>
              )}
            />
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  t('auth.changing')
                </>
              ) : (
                t('auth.changePassword')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
