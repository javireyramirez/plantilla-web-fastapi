import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { Setting } from '../model/settings.schema';

interface SettingsFormProps {
  setting: Setting;
  description: string;
  setDescription: (val: string) => void;
  valueType: 'boolean' | 'number' | 'json' | 'string';
  stringValue: string;
  setStringValue: (val: string) => void;
  boolValue: boolean;
  setBoolValue: (val: boolean) => void;
  numValue: number;
  setNumValue: (val: number) => void;
  jsonValue: string;
  setJsonValue: (val: string) => void;
  isSuperAdmin: boolean;
  isSaving: boolean;
}

export function SettingsForm({
  setting,
  description,
  setDescription,
  valueType,
  stringValue,
  setStringValue,
  boolValue,
  setBoolValue,
  numValue,
  setNumValue,
  jsonValue,
  setJsonValue,
  isSuperAdmin,
  isSaving,
}: SettingsFormProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna 1: Metadatos del Sistema */}
      <Card className="lg:col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t('settings.metadata', { defaultValue: 'Metadatos del Sistema' })}
          </CardTitle>
          <CardDescription>
            {t('settings.metadataDescription', {
              defaultValue: 'Identificador único y propiedades inmutables.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="setting-key" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('settings.key', { defaultValue: 'Clave' })}
            </Label>
            <Input
              id="setting-key"
              value={setting.key}
              readOnly
              className="font-mono text-xs bg-muted/40 cursor-not-allowed select-all text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('settings.category', { defaultValue: 'Categoría' })}
            </Label>
            <div>
              <Badge variant="outline" className="uppercase text-[11px] font-mono tracking-wider font-semibold">
                {setting.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columna 2: Configuración del Valor y Descripción */}
      <Card className="lg:col-span-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {t('settings.valueAndDescription', { defaultValue: 'Configuración y Parámetro' })}
              </CardTitle>
              <CardDescription>
                {t('settings.valueDescription', {
                  defaultValue: 'Modifica el valor activo y la descripción explicativa.',
                })}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
              {valueType}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isSuperAdmin && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>
                {t('settings.errors.superAdminOnlyNotice', {
                  defaultValue:
                    'Estás en modo de solo lectura. Solo los Superadministradores pueden guardar cambios.',
                })}
              </span>
            </div>
          )}

          {/* Campo: Descripción */}
          <div className="space-y-2">
            <Label htmlFor="setting-description" className="text-xs font-semibold">
              {t('settings.description', { defaultValue: 'Descripción' })}
            </Label>
            <Input
              id="setting-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('settings.descriptionPlaceholder', {
                defaultValue: 'Descripción del propósito de esta configuración',
              })}
              disabled={!isSuperAdmin || isSaving}
              className="text-sm"
            />
          </div>

          {/* Campo: Valor según Tipo Inmutable */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="setting-value" className="text-xs font-semibold">
                {t('settings.value', { defaultValue: 'Valor de configuración' })}
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {typeof setting.value === 'number' && Number.isInteger(setting.value)
                  ? 'INTEGER (>= 0)'
                  : valueType.toUpperCase()}
              </span>
            </div>

            {valueType === 'boolean' && (
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="setting-value"
                  checked={boolValue}
                  onCheckedChange={setBoolValue}
                  disabled={!isSuperAdmin || isSaving}
                />
                <span className="text-sm font-medium">
                  {boolValue
                    ? t('common.enabled', { defaultValue: 'Habilitado (true)' })
                    : t('common.disabled', { defaultValue: 'Deshabilitado (false)' })}
                </span>
              </div>
            )}

            {valueType === 'number' && (
              <div className="space-y-1.5">
                <Input
                  id="setting-value"
                  type="number"
                  min={0}
                  step={typeof setting.value === 'number' && Number.isInteger(setting.value) ? '1' : 'any'}
                  value={numValue}
                  onChange={(e) => setNumValue(Number(e.target.value))}
                  disabled={!isSuperAdmin || isSaving}
                  className="font-mono text-sm max-w-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('settings.numberNonNegative', {
                    defaultValue: 'El valor debe ser un número igual o superior a 0.',
                  })}
                </p>
              </div>
            )}

            {valueType === 'string' && (
              <Input
                id="setting-value"
                type="text"
                value={stringValue}
                onChange={(e) => setStringValue(e.target.value)}
                disabled={!isSuperAdmin || isSaving}
                className="text-sm"
              />
            )}

            {valueType === 'json' && (
              <div className="space-y-1.5">
                <Textarea
                  id="setting-value"
                  rows={12}
                  value={jsonValue}
                  onChange={(e) => setJsonValue(e.target.value)}
                  disabled={!isSuperAdmin || isSaving}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="{ ... }"
                />
                <p className="text-[11px] text-muted-foreground">
                  {Array.isArray(setting.value)
                    ? t('settings.jsonArrayHelp', {
                        defaultValue: 'Introduce una lista/array JSON válida: ["item1", "item2"].',
                      })
                    : t('settings.jsonObjectHelp', {
                        defaultValue: 'Introduce un objeto JSON válido: { "clave": "valor" }.',
                      })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
