import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import * as React from 'react';

import usePermissions from '@/hooks/use-permissions';

import { settingsQueries } from './settings.query';
import { Setting, UpdateSettingBody } from './settings.schema';

export function useSettingsDetail(key: string) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();

  const { data: setting, isLoading, isError } = settingsQueries.useGetByKey(key);
  const updateMutation = settingsQueries.useUpdate(key);

  const [description, setDescription] = React.useState('');
  const [valueType, setValueType] = React.useState<'boolean' | 'number' | 'json' | 'string'>('string');
  const [stringValue, setStringValue] = React.useState('');
  const [boolValue, setBoolValue] = React.useState(false);
  const [numValue, setNumValue] = React.useState<number>(0);
  const [jsonValue, setJsonValue] = React.useState('');

  // Sync state when setting is loaded
  React.useEffect(() => {
    if (setting) {
      setDescription(setting.description || '');

      const val = setting.value;
      if (typeof val === 'boolean') {
        setValueType('boolean');
        setBoolValue(val);
      } else if (typeof val === 'number') {
        setValueType('number');
        setNumValue(val);
      } else if (typeof val === 'object' && val !== null) {
        setValueType('json');
        setJsonValue(JSON.stringify(val, null, 2));
      } else {
        setValueType('string');
        setStringValue(String(val ?? ''));
      }
    }
  }, [setting]);

  const handleSave = async (options?: { shouldClose?: boolean }) => {
    if (!isSuperAdmin) {
      toast.error(
        t('settings.errors.superAdminOnly', {
          defaultValue: 'Solo los Superadministradores tienen permisos para modificar la configuración.',
        })
      );
      return;
    }

    let resolvedValue: any;
    const originalVal = setting?.value;

    if (valueType === 'boolean') {
      resolvedValue = boolValue;
    } else if (valueType === 'number') {
      resolvedValue = Number(numValue);
      if (isNaN(resolvedValue)) {
        toast.error(t('settings.errors.invalidNumber', { defaultValue: 'El valor numérico no es válido' }));
        return;
      }
      if (resolvedValue < 0) {
        toast.error(
          t('settings.errors.negativeNumber', {
            defaultValue: 'El valor numérico debe ser mayor o igual a 0.',
          })
        );
        return;
      }
      if (typeof originalVal === 'number' && Number.isInteger(originalVal) && !Number.isInteger(resolvedValue)) {
        toast.error(
          t('settings.errors.mustBeInteger', {
            defaultValue: 'El parámetro requiere un número entero.',
          })
        );
        return;
      }
    } else if (valueType === 'json') {
      try {
        resolvedValue = JSON.parse(jsonValue);
      } catch {
        toast.error(t('settings.errors.invalidJson', { defaultValue: 'Formato JSON inválido' }));
        return;
      }

      if (Array.isArray(originalVal) && !Array.isArray(resolvedValue)) {
        toast.error(
          t('settings.errors.mustBeArray', {
            defaultValue: 'El parámetro original es una lista, el valor debe ser un array JSON [ ... ].',
          })
        );
        return;
      }
      if (
        typeof originalVal === 'object' &&
        originalVal !== null &&
        !Array.isArray(originalVal) &&
        (typeof resolvedValue !== 'object' || resolvedValue === null || Array.isArray(resolvedValue))
      ) {
        toast.error(
          t('settings.errors.mustBeObject', {
            defaultValue: 'El parámetro original es un objeto, el valor debe ser un objeto JSON { ... }.',
          })
        );
        return;
      }
    } else {
      resolvedValue = stringValue;
    }

    const payload: UpdateSettingBody = {
      value: resolvedValue,
      description: description.trim() || null,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t('settings.saved', { defaultValue: 'Configuración guardada correctamente' }));
        if (options?.shouldClose) {
          navigate('/admin/settings');
        }
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
        toast.error(msg || t('settings.errors.save', { defaultValue: 'Error al guardar la configuración' }));
      },
    });
  };

  return {
    setting,
    isLoading,
    isError,
    isSaving: updateMutation.isPending,
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
    handleSave,
    isSuperAdmin,
  };
}
