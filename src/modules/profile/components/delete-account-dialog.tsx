import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Eye, EyeOff, LoaderCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import FormFieldWrapper from '@/components/form/form-field-wrapper';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useDeleteAccount } from '@/hooks/use-auth';
import { DeleteAccountSchema, DeleteAccountValues } from '@/modules/auth/model/auth.schema';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | null;
}

export function DeleteAccountDialog({ open, onOpenChange, userEmail }: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

  const form = useForm<DeleteAccountValues>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      password: '',
      confirmText: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (values: DeleteAccountValues) => {
    try {
      await deleteAccountMutation.mutateAsync({
        password: values.password || null,
      });
      toast.success(
        t('profile.accountDeletedSuccess', {
          defaultValue: 'Tu cuenta ha sido eliminada correctamente.',
        })
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err.message ||
          t('profile.accountDeletedError', {
            defaultValue: 'Error al eliminar la cuenta. Verifica tu contraseña.',
          })
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setShowPassword(false);
    }
    onOpenChange(newOpen);
  };

  const confirmTextValue = form.watch('confirmText');
  const isConfirmValid = confirmTextValue === 'ELIMINAR' || confirmTextValue === 'DELETE';

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-destructive/30">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2.5 text-destructive shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg text-destructive">
                {t('profile.deleteAccountTitle', { defaultValue: '¿Eliminar tu cuenta definitivamente?' })}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                {userEmail}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground py-2">
          <p className="font-medium text-foreground">
            {t('profile.deleteAccountWarning', {
              defaultValue:
                'Esta acción es completamente irreversible. Se eliminarán permanentemente tus datos, permisos y todas tus sesiones activas.',
            })}
          </p>

          <form id="delete-account-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contraseña para confirmación */}
            <div className="space-y-1">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel htmlFor="delete_account_password">
                      {t('profile.deletePasswordPrompt', {
                        defaultValue: 'Introduce tu contraseña para confirmar',
                      })}
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        value={field.value || ''}
                        id="delete_account_password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-10"
                        disabled={deleteAccountMutation.isPending}
                        aria-invalid={fieldState.invalid}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={deleteAccountMutation.isPending}
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

            {/* Texto de confirmación */}
            <div className="space-y-1">
              <Controller
                name="confirmText"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel htmlFor="delete_confirm_text">
                      {t('profile.deleteConfirmPrompt', {
                        defaultValue: 'Escribe ELIMINAR para continuar:',
                      })}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="delete_confirm_text"
                      placeholder="ELIMINAR"
                      autoComplete="off"
                      disabled={deleteAccountMutation.isPending}
                      aria-invalid={fieldState.invalid}
                      className="font-mono uppercase tracking-wider"
                    />
                  </FormFieldWrapper>
                )}
              />
            </div>
          </form>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteAccountMutation.isPending}
          >
            {t('common.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button
            type="submit"
            form="delete-account-form"
            variant="destructive"
            disabled={!isConfirmValid || deleteAccountMutation.isPending}
            className="gap-2"
          >
            {deleteAccountMutation.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {t('profile.deletingAccount', { defaultValue: 'Eliminando...' })}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {t('profile.confirmDeleteAccount', { defaultValue: 'Eliminar mi cuenta' })}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export default DeleteAccountDialog;
