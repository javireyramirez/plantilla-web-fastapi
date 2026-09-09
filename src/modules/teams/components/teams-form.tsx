import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TeamsDetailFormProps {
  isEditing: boolean;
}

export function TeamsDetailForm({ isEditing }: TeamsDetailFormProps) {
  const { t } = useTranslation();
  const form = useFormContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Formulario de Datos Básicos */}
      <Card className="lg:col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('teams.basicData')}</CardTitle>
          <CardDescription>{t('teams.identificationInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="team-form-id" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="team-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('teams.name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="team-name"
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      placeholder={t('teams.namePlaceholder')}
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
                      htmlFor="team-description"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('teams.description')}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="team-description"
                      value={field.value ?? ''}
                      placeholder={t('teams.descriptionPlaceholder')}
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
