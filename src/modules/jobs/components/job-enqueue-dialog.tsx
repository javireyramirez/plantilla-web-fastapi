import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { jobsQueries } from '../model/jobs.query';
import {
  getJobDefinitionDescription,
  getJobDefinitionTitle,
  getJobIcon,
} from '../model/jobs.types';

interface JobEnqueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobEnqueueDialog({ open, onOpenChange }: JobEnqueueDialogProps) {
  const { t } = useTranslation();
  const [selectedDefName, setSelectedDefName] = React.useState<string>('custom');
  const [name, setName] = React.useState('');
  const [entityType, setEntityType] = React.useState('');
  const [entityId, setEntityId] = React.useState('');
  const [maxRetries, setMaxRetries] = React.useState(3);
  const [payloadText, setPayloadText] = React.useState('{\n  \n}');
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const { data: definitions, isLoading: isLoadingDefs } = jobsQueries.useDefinitions();
  const { mutateAsync: enqueue, isPending } = jobsQueries.useEnqueue();

  const resetForm = () => {
    setSelectedDefName('custom');
    setName('');
    setEntityType('');
    setEntityId('');
    setMaxRetries(3);
    setPayloadText('{\n  \n}');
    setJsonError(null);
  };

  const handleSelectDefinition = (defName: string) => {
    setSelectedDefName(defName);
    if (defName === 'custom') {
      setName('');
      return;
    }

    const def = definitions?.find((d) => d.name === defName);
    if (def) {
      setName(def.name);
      if (def.payload_schema && Object.keys(def.payload_schema).length > 0) {
        setPayloadText(JSON.stringify(def.payload_schema, null, 2));
      }
    }
  };

  const selectedDef = definitions?.find((d) => d.name === selectedDefName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(
        t('jobs.dialog.nameRequired', { defaultValue: 'El nombre de la tarea es obligatorio' })
      );
      return;
    }

    let parsedPayload: Record<string, any> | undefined;
    if (payloadText.trim()) {
      try {
        parsedPayload = JSON.parse(payloadText);
        if (typeof parsedPayload !== 'object' || Array.isArray(parsedPayload)) {
          setJsonError(
            t('jobs.dialog.payloadMustBeObject', {
              defaultValue: 'El payload debe ser un objeto JSON válido',
            })
          );
          return;
        }
      } catch {
        setJsonError(
          t('jobs.dialog.invalidJson', {
            defaultValue: 'El formato JSON introducido no es válido',
          })
        );
        return;
      }
    }

    setJsonError(null);

    try {
      await enqueue({
        name: name.trim(),
        entity_type: entityType.trim() || undefined,
        entity_id: entityId.trim() || undefined,
        max_retries: maxRetries,
        lease_duration_seconds: 300,
        payload: parsedPayload,
      });

      toast.success(
        t('jobs.dialog.enqueueSuccess', { defaultValue: 'Tarea encolada correctamente' })
      );
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;
      toast.error(
        msg || t('jobs.dialog.enqueueError', { defaultValue: 'Error al encolar la tarea' })
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isPending) {
          if (!val) resetForm();
          onOpenChange(val);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {t('jobs.dialog.enqueueTitle', { defaultValue: 'Encolar nueva tarea' })}
            </DialogTitle>
            <DialogDescription>
              {t('jobs.dialog.enqueueDescription', {
                defaultValue:
                  'Registra y programa una tarea en segundo plano para su procesamiento.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Catálogo de tipos de tarea (Backend-Driven) */}
            {definitions && definitions.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="job-definition-select">
                  {t('jobs.catalog.selectDefinition', {
                    defaultValue: 'Catálogo de tareas registradas',
                  })}
                </Label>
                <Select
                  value={selectedDefName}
                  onValueChange={handleSelectDefinition}
                  disabled={isPending || isLoadingDefs}
                >
                  <SelectTrigger id="job-definition-select" className="w-full">
                    <SelectValue
                      placeholder={t('jobs.catalog.selectPlaceholder', {
                        defaultValue: 'Seleccionar tipo de tarea...',
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {definitions.map((def) => {
                      const Icon = getJobIcon(def.icon);
                      return (
                        <SelectItem key={def.name} value={def.name}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{getJobDefinitionTitle(t, def.name, def.title)}</span>
                            <span className="text-xs text-muted-foreground">({def.name})</span>
                            {def.is_dispatchable && (
                              <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">
                                {t('jobs.catalog.dispatchable', { defaultValue: 'Ejecutable' })}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="custom">
                      <span className="italic text-muted-foreground">
                        {t('jobs.catalog.customJob', { defaultValue: 'Tarea personalizada (manual)...' })}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedDef && (
                  <p className="text-xs text-muted-foreground">
                    {getJobDefinitionDescription(t, selectedDef.name, selectedDef.description)}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="job-name">
                {t('jobs.name', { defaultValue: 'Nombre de la tarea' })}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="job-name"
                placeholder={t('jobs.dialog.namePlaceholder', {
                  defaultValue: 'ej: exports.generate, trash.purge',
                })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending || selectedDefName !== 'custom'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="job-entity-type">
                  {t('jobs.entityType', { defaultValue: 'Tipo de entidad' })}
                </Label>
                <Input
                  id="job-entity-type"
                  placeholder={t('jobs.dialog.entityTypePlaceholder', {
                    defaultValue: 'ej: companies, users',
                  })}
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="job-max-retries">
                  {t('jobs.maxRetries', { defaultValue: 'Reintentos máx.' })}
                </Label>
                <Input
                  id="job-max-retries"
                  type="number"
                  min={0}
                  max={10}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-entity-id">
                {t('jobs.entityId', { defaultValue: 'ID de entidad (UUID opcional)' })}
              </Label>
              <Input
                id="job-entity-id"
                placeholder={t('jobs.dialog.entityIdPlaceholder', {
                  defaultValue: '00000000-0000-0000-0000-000000000000',
                })}
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-payload">
                {t('jobs.payload', { defaultValue: 'Carga útil (Payload JSON)' })}
              </Label>
              <Textarea
                id="job-payload"
                className="font-mono text-xs h-28"
                placeholder="{}"
                value={payloadText}
                onChange={(e) => {
                  setPayloadText(e.target.value);
                  if (jsonError) setJsonError(null);
                }}
                disabled={isPending}
              />
              {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('jobs.dialog.enqueueSubmit', { defaultValue: 'Encolar' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
