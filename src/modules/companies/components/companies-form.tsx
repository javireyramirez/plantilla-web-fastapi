import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Company } from '../model/companies.schema';
import { SECTOR_OPTIONS } from '../model/companies.types';

interface CompaniesDetailFormProps {
  isEditing: boolean;
  company?: Company | null;
}


export function CompaniesDetailForm({ isEditing, company }: CompaniesDetailFormProps) {
  const { t } = useTranslation();
  const form = useFormContext();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna 1: Formulario de Datos Básicos */}
      <Card className="lg:col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t('companies.basicData')}
          </CardTitle>
          <CardDescription>{t('companies.identificationInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="company-form-id" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="company-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('companies.name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="company-name"
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      placeholder={t('companies.namePlaceholder')}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />

              <Controller
                name="nif"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="company-nif"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('companies.cifNif')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="company-nif"
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      placeholder="A1234567B"
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />

              <Controller
                name="sector"
                control={form.control}
                render={({ field, fieldState }) => {
                  const sectorValue = (field.value || '').trim().toLowerCase();
                  const selectedSector = SECTOR_OPTIONS.find(
                    (option) => option.value.toLowerCase() === sectorValue
                  );
                  const sectorLabel = selectedSector
                    ? t(`companies.sectors.${selectedSector.value}`)
                    : field.value || undefined;

                  return (
                    <FormFieldWrapper fieldState={fieldState}>
                      <FieldLabel
                        htmlFor="company-sector"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {t('companies.sector')}
                      </FieldLabel>
                      <Select
                        key={field.value || 'empty'}
                        value={selectedSector ? selectedSector.value : field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="company-sector"
                          className="mt-1.5 focus-visible:ring-primary w-full"
                          aria-invalid={fieldState.invalid}
                          data-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder={t('companies.selectSector')}>
                            {sectorLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {SECTOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(`companies.sectors.${option.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormFieldWrapper>
                  );
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
