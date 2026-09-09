import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
import { useRequestPasswordReset } from '@/hooks/use-auth.js';
import { ForgotPasswordSchema } from '@/modules/auth/model/auth.schema.js';
import { ForgotPasswordValues } from '@/modules/auth/model/auth.schema.js';

export default function ForgotPassword() {
  const { t } = useTranslation();

  const useRequestPasswordResetMutation = useRequestPasswordReset();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordValues) => {
    useRequestPasswordResetMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth.toastSuccessForgot'));
      },

      onError: (error) => {
        toast.error(error?.message || t('auth.toastErrorForgot'));
      },
    });
  };

  const isSubmitting = useRequestPasswordResetMutation.isPending;

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
          <CardDescription>{t('auth.recoverPassword')}</CardDescription>
        </CardHeader>
        <form id="form-signin" onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground mb-2">{t('auth.recoverInstructions')} </p>
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
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-4">
            {/* Botón de Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.send')}{' '}
                </>
              ) : (
                t('auth.send')
              )}
            </Button>

            <Button
              variant="link"
              className="h-auto p-0 text-link hover:text-link-hover hover:underline transition-colors"
              asChild
            >
              <Link to="/signin" tabIndex={isSubmitting ? -1 : 0}>
                {t('auth.yetRegister')}
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
