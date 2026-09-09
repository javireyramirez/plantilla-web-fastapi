import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface UsersDetailFormProps {
  isEditing: boolean;
  isActive: boolean;
}

export function UsersDetailForm({ isEditing, isActive }: UsersDetailFormProps) {
  const { t } = useTranslation();
  const form = useFormContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <Card
        className={`lg:col-span-1 shadow-sm transition-all duration-300 relative ${
          isEditing && !isActive ? 'pointer-events-none select-none opacity-70' : ''
        }`}
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('users.basicData')}</CardTitle>
          <CardDescription>{t('users.identificationInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="user-form-id" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="user-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('users.name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-name"
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="user-email"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('users.email')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-email"
                      disabled={isEditing}
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

