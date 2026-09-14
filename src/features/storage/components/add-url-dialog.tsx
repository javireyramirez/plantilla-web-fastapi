import * as React from 'react';
import { Link2, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useAddExternalUrl } from '../model/use-storage';

interface AddUrlDialogProps {
  entityType: string;
  entityId: string;
  trigger?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AddUrlDialog({
  entityType,
  entityId,
  trigger,
  variant = 'outline',
  size = 'default',
}: AddUrlDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const { mutate: addExternalUrl, isPending } = useAddExternalUrl();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setUrl('');
      setName('');
      setDescription('');
    }
    setOpen(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanName = name.trim();

    if (!cleanUrl) {
      toast.error(t('storage.urlRequired', { defaultValue: 'Por favor, introduce una URL válida.' }));
      return;
    }
    if (!cleanName) {
      toast.error(t('storage.nameRequired', { defaultValue: 'Por favor, introduce un nombre para el recurso.' }));
      return;
    }

    addExternalUrl(
      {
        entityType,
        entityId,
        data: {
          url: cleanUrl,
          name: cleanName,
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('storage.toast.urlSuccess', { defaultValue: 'Enlace añadido con éxito' }));
          handleOpenChange(false);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ||
            err?.message ||
            t('storage.toast.urlError', { defaultValue: 'Error al añadir el enlace' });
          toast.error(message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant={variant} size={size}>
            <Link2 className="w-4 h-4 mr-2" />
            {t('storage.addUrl', { defaultValue: 'Añadir URL' })}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('storage.addUrlTitle', { defaultValue: 'Añadir enlace externo' })}</DialogTitle>
            <DialogDescription>
              {t('storage.addUrlDescription', {
                defaultValue: 'Añade un enlace directo a Google Drive, OneDrive, Dropbox u otro recurso web.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="url">{t('storage.urlLabel', { defaultValue: 'URL del recurso' })} *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://drive.google.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">{t('storage.nameLabel', { defaultValue: 'Nombre del recurso' })} *</Label>
              <Input
                id="name"
                placeholder={t('storage.namePlaceholder', {
                  defaultValue: 'Ej. Carpeta Drive, Documento compartido...',
                })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t('storage.descriptionLabel', { defaultValue: 'Descripción' })}</Label>
              <Textarea
                id="description"
                placeholder={t('storage.descriptionPlaceholder', {
                  defaultValue: 'Detalles o notas sobre el enlace (opcional)',
                })}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save', { defaultValue: 'Guardar' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
