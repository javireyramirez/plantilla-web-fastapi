import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, Mail } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useState } from 'react';

import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Button } from '@/components/ui/button.js';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Checkbox } from '@/components/ui/checkbox.js';
import { FieldError, FieldLabel } from '@/components/ui/field.js';
import { Input } from '@/components/ui/input.js';
import { Separator } from '@/components/ui/separator.js';
import { useSession } from '@/config/auth-client.js';
import { useChangePassword, useSendVerificationEmail } from '@/hooks/use-auth.js';
import { ChangePasswordSchema } from '@/modules/auth/model/auth.schema.js';
import { ChangePasswordSchemaValues } from '@/modules/auth/model/auth.schema.js';

export default function Profile() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isVerified = session?.user?.emailVerified;
  const toggleVisibility = (field: 'newPassword' | 'confirmPassword' | 'currentPassword') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const useChangePasswordMutation = useChangePassword();
  const {
    mutate: sendEmail,
    isPending: isPendingMail,
    isSuccess: isSuccessMail,
  } = useSendVerificationEmail();

  const form = useForm<ChangePasswordSchemaValues>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      revokeOtherSessions: false,
    },
  });

  if (!session?.user) {
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

  const onSubmit = (data: ChangePasswordSchemaValues) => {
    useChangePasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('profile.toast.passwordChanged'));
      },

      onError: (error) => {
        toast.error(error?.message || t('profile.toast.passwordChangeFailed'));
      },
    });
  };

  const isSubmitting = useChangePasswordMutation.isPending;

  const handleVerificationEmail = () => {
    if (!session?.user?.email) {
      toast.error(t('profile.toast.noEmailFound'));
      return;
    }

    sendEmail(
      { email: session.user.email },
      {
        onSuccess: () => toast.success(t('profile.toast.verificationSent')),
        onError: (error) => toast.error(error?.message || t('profile.toast.sendError')),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen items-center">
      <div className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle className="flex flex-col flex-wrap items-center justify-center mb-4">
            {t('profile.emailVerification')}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col gap-2">
          <Button
            className="w-full h-10"
            onClick={handleVerificationEmail}
            disabled={isPendingMail || isVerified || isSuccessMail}
          >
            {isVerified ? (
              t('profile.emailVerified')
            ) : isPendingMail ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {t('profile.sending')}
              </>
            ) : isSuccessMail ? (
              t('profile.sentSuccessfully')
            ) : (
              <span className="flex items-center gap-2">
                <Mail className="size-4" />
                {t('profile.sendVerificationLink')}
              </span>
            )}
          </Button>

          {!isVerified && isSuccessMail && (
            <p className="text-xs text-muted-foreground text-center animate-in fade-in">
              {t('profile.checkInboxOrSpam')}
            </p>
          )}
        </CardFooter>
      </div>
      <div className="w-full max-w-sm">
        <Separator />
      </div>
      <div className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle className="flex flex-col flex-wrap items-center justify-center mb-4">
            {t('profile.changePassword')}
          </CardTitle>
        </CardHeader>
        <form id="form-signin" onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Campo de Antigua Contraseña */}
              <div className="grid gap-2">
                <Controller
                  name="currentPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper fieldState={fieldState}>
                      <FieldLabel htmlFor="currentPassword">
                        {t('profile.currentPassword')}
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          className="pr-10"
                          id="currentPassword"
                          type={showPassword.currentPassword ? 'text' : 'password'}
                          aria-invalid={fieldState.invalid}
                          autoComplete="current-password"
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleVisibility('currentPassword')}
                          disabled={isSubmitting}
                          aria-label={
                            showPassword.currentPassword
                              ? t('profile.hidePassword')
                              : t('profile.showPassword')
                          }
                        >
                          {showPassword.currentPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </FormFieldWrapper>
                  )}
                />
              </div>

              {/* Campo de Nueva Contraseña */}
              <div className="grid gap-2">
                <Controller
                  name="newPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper fieldState={fieldState}>
                      <FieldLabel htmlFor="newPassword">{t('profile.newPassword')}</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          className="pr-10"
                          id="newPassword"
                          type={showPassword.newPassword ? 'text' : 'password'}
                          aria-invalid={fieldState.invalid}
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
                            showPassword.newPassword
                              ? t('profile.hidePassword')
                              : t('profile.showPassword')
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
              </div>

              {/* Campo de Repetir Contraseña */}
              <div className="grid gap-2">
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper fieldState={fieldState}>
                      <FieldLabel htmlFor="confirmPassword">
                        {t('profile.repeatPassword')}
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          className="pr-10"
                          id="confirmPassword"
                          type={showPassword.confirmPassword ? 'text' : 'password'}
                          aria-invalid={fieldState.invalid}
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
                            showPassword.confirmPassword
                              ? t('profile.hidePassword')
                              : t('profile.showPassword')
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
              </div>

              {/* Campo revocar otras sesiones */}
              <Controller
                name="revokeOtherSessions"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="revokeOtherSessions"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="revokeOtherSessions" className="text-sm font-medium">
                        {t('profile.revokeOtherSessions')}
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
                  {t('profile.updating')}
                </>
              ) : (
                t('profile.updatePassword')
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </div>
  );
}
