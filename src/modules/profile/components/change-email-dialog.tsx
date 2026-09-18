import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import FormFieldWrapper from '@/components/form/form-field-wrapper';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useChangeEmail } from '@/hooks/use-auth';
import { ChangeEmailSchema, ChangeEmailValues } from '@/modules/auth/model/auth.schema';

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string | null;
}

export function ChangeEmailDialog({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const changeEmailMutation = useChangeEmail();

  const form = useForm<ChangeEmailValues>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      new_email: '',
      current_password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ChangeEmailValues) => {
    if (currentEmail && values.new_email.toLowerCase() === currentEmail.toLowerCase()) {
      form.setError('new_email', {
        type: 'manual',
        message: t('profile.sameEmailError', {
          defaultValue: 'El nuevo correo no puede ser igual al correo actual',
        }),
      });
      return;
    }

    try {
      await changeEmailMutation.mutateAsync({
        new_email: values.new_email,
        current_password: values.current_password || null,
      });
      toast.success(
        t('profile.emailChangedSuccess', {
          defaultValue: 'Correo electrónico actualizado correctamente',
        })
      );
      form.reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || t('profile.emailChangedError', { defaultValue: 'Error al cambiar correo' }));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setShowPassword(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            {t('profile.changeEmailTitle', { defaultValue: 'Cambiar correo electrónico' })}
          </DialogTitle>
          <DialogDescription>
            {t('profile.changeEmailDesc', {
              defaultValue:
                'Introduce tu nueva dirección de correo. Es posible que debas verificarla posteriormente.',
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Correo actual (informativo) */}
          {currentEmail && (
            <div className="space-y-1">
              <FieldLabel className="text-xs text-muted-foreground">
                {t('profile.currentEmailLabel', { defaultValue: 'Correo actual' })}
              </FieldLabel>
              <Input value={currentEmail} readOnly disabled className="bg-muted/50" />
            </div>
          )}

          {/* Nuevo Correo */}
          <div className="space-y-1">
            <Controller
              name="new_email"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldWrapper fieldState={fieldState}>
                  <FieldLabel htmlFor="new_email">
                    {t('profile.newEmailLabel', { defaultValue: 'Nuevo correo electrónico' })}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="new_email"
                    type="email"
                    placeholder="nuevo@ejemplo.com"
                    autoComplete="email"
                    disabled={changeEmailMutation.isPending}
                    aria-invalid={fieldState.invalid}
                  />
                </FormFieldWrapper>
              )}
            />
          </div>

          {/* Contraseña Actual */}
          <div className="space-y-1">
            <Controller
              name="current_password"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldWrapper fieldState={fieldState}>
                  <FieldLabel htmlFor="change_email_current_password">
                    {t('profile.currentPasswordOptional', {
                      defaultValue: 'Contraseña actual (si aplica)',
                    })}
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value || ''}
                      id="change_email_current_password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="pr-10"
                      disabled={changeEmailMutation.isPending}
                      aria-invalid={fieldState.invalid}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={changeEmailMutation.isPending}
                      aria-label={
                        showPassword
                          ? t('profile.hidePassword', { defaultValue: 'Ocultar contraseña' })
                          : t('profile.showPassword', { defaultValue: 'Mostrar contraseña' })
                      }
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormFieldWrapper>
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={changeEmailMutation.isPending}
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </Button>
            <Button type="submit" disabled={changeEmailMutation.isPending}>
              {changeEmailMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving', { defaultValue: 'Guardando...' })}
                </>
              ) : (
                t('profile.confirmChangeEmail', { defaultValue: 'Actualizar correo' })
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default ChangeEmailDialog;
