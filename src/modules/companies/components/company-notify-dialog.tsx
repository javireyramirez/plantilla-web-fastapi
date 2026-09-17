import { BellRing, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import * as React from 'react';

import { Selector } from '@/components/selector/selector';
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
import { Textarea } from '@/components/ui/textarea';
import { companiesQueries } from '@/modules/companies/model/companies.query';
import { useUsersOptions } from '@/modules/users/model/users.query';

interface CompanyNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

export function CompanyNotifyDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
}: CompanyNotifyDialogProps) {
  const { t } = useTranslation();
  const { mutate: sendNotification, isPending } = companiesQueries.useNotify();

  const [recipientId, setRecipientId] = React.useState<string | undefined>(undefined);
  const [title, setTitle] = React.useState('');
  const [comment, setComment] = React.useState('');

  // Sincronizar los textos por defecto cuando se abre el diálogo o cambia la compañía
  React.useEffect(() => {
    if (open) {
      setTitle(
        t('companies.notify.defaultTitle', {
          company: companyName,
          defaultValue: `Notificación sobre ${companyName}`,
        })
      );
      setComment(
        t('companies.notify.defaultComment', {
          company: companyName,
          defaultValue: `Ejemplo de notificación de compañía: ${companyName}`,
        })
      );
    } else {
      setRecipientId(undefined);
    }
  }, [open, companyName, t]);

  const handleSend = () => {
    if (!recipientId) return;

    const finalTitle =
      title.trim() ||
      t('companies.notify.defaultTitle', {
        company: companyName,
        defaultValue: `Notificación sobre ${companyName}`,
      });

    const finalComment =
      comment.trim() ||
      t('companies.notify.defaultComment', {
        company: companyName,
        defaultValue: `Ejemplo de notificación de compañía: ${companyName}`,
      });

    sendNotification(
      {
        companyId,
        payload: {
          recipient_id: recipientId,
          title: finalTitle,
          comment: finalComment,
          notification_type: 'INFO',
          action_url: `/companies/${companyId}`,
          data: {
            company_id: companyId,
            company_name: companyName,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(
            t('companies.notify.success', {
              defaultValue: 'Notificación enviada con éxito',
            })
          );
          onOpenChange(false);
          setRecipientId(undefined);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            t('companies.notify.error', {
              defaultValue: 'Error al enviar la notificación',
            });
          toast.error(message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>
                {t('companies.notify.dialogTitle', {
                  defaultValue: 'Enviar notificación de compañía',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('companies.notify.dialogDescription', {
                  defaultValue:
                    'Envía una notificación en tiempo real a un usuario vinculada a esta compañía.',
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selector de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="recipient-select" className="text-sm font-medium">
              {t('companies.notify.userLabel', { defaultValue: 'Usuario destinatario' })}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Selector
              useGetList={useUsersOptions}
              value={recipientId}
              onChange={(val) => setRecipientId(val as string | undefined)}
              placeholder={t('companies.notify.selectUserPlaceholder', {
                defaultValue: 'Seleccionar usuario...',
              })}
              searchPlaceholder={t('companies.notify.searchUserPlaceholder', {
                defaultValue: 'Buscar usuario...',
              })}
              emptyMessage={t('companies.notify.noUsersFound', {
                defaultValue: 'No se encontraron usuarios',
              })}
              className="w-full"
            />
          </div>

          {/* Título de la Notificación */}
          <div className="space-y-2">
            <Label htmlFor="notify-title" className="text-sm font-medium">
              {t('companies.notify.titleLabel', { defaultValue: 'Título' })}
            </Label>
            <Input
              id="notify-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('companies.notify.titlePlaceholder', {
                defaultValue: 'Título de la notificación',
              })}
            />
          </div>

          {/* Mensaje / Comentario */}
          <div className="space-y-2">
            <Label htmlFor="notify-comment" className="text-sm font-medium">
              {t('companies.notify.commentLabel', {
                defaultValue: 'Mensaje / Comentario',
              })}
            </Label>
            <Textarea
              id="notify-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('companies.notify.commentPlaceholder', {
                defaultValue: 'Escribe el mensaje o comentario...',
              })}
            />
          </div>

          {/* URL de destino informativa */}
          <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {t('companies.notify.actionUrlLabel', { defaultValue: 'Enlace de acción' })}:
            </span>{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              /companies/{companyId}
            </code>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('companies.notify.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button
            type="button"
            disabled={!recipientId || isPending}
            onClick={handleSend}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('companies.notify.sending', { defaultValue: 'Enviando...' })}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('companies.notify.send', { defaultValue: 'Enviar notificación' })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
