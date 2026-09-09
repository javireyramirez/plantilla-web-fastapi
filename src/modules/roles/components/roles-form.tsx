import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface RolesDetailFormProps {
  isEditing: boolean;
}

export function RolesDetailForm({ isEditing }: RolesDetailFormProps) {
  const { t } = useTranslation();
  const form = useFormContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Formulario de Datos Básicos */}
      <Card className="lg:col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('roles.basicData')}</CardTitle>
          <CardDescription>{t('roles.identificationInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="role-form-id" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="role-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('roles.name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="role-name"
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="role-description"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('roles.description')}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="role-description"
                      value={field.value ?? ''}
                      placeholder={t('roles.descriptionPlaceholder')}
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary min-h-[100px]"
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
