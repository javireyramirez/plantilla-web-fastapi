import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  KeyRound,
  LoaderCircle,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  useCurrentUser,
  useTwoFactorDisable,
  useTwoFactorEnable,
  useTwoFactorRecoveryCodes,
  useTwoFactorSetup,
} from '@/hooks/use-auth';
import { useSession } from '@/config/auth-client';

export default function TwoFactorSettings() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: currentUser, refetch: refetchUser } = useCurrentUser();

  // Determinar si 2FA está habilitado desde currentUser o sesión fallback
  const isTwoFactorEnabled = Boolean(
    currentUser?.two_factor_enabled ??
      (session?.user as any)?.two_factor_enabled ??
      false
  );

  // Estados para diálogos
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  // Datos temporales
  const [setupData, setSetupData] = useState<{
    secret: string;
    uri: string;
    qr_code_data_uri: string;
  } | null>(null);

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [disableMethod, setDisableMethod] = useState<'totp' | 'password'>('totp');
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  // Mutaciones
  const setupMutation = useTwoFactorSetup();
  const enableMutation = useTwoFactorEnable();
  const disableMutation = useTwoFactorDisable();
  const recoveryCodesMutation = useTwoFactorRecoveryCodes();

  // 1. Iniciar Configuración
  const handleOpenSetup = () => {
    setVerificationCode('');
    setShowSetupDialog(true);
    setupMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSetupData(data);
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Error al iniciar la configuración de 2FA');
        setShowSetupDialog(false);
      },
    });
  };

  // 2. Confirmar y Activar 2FA
  const handleConfirmEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      toast.error(t('twoFactor.verifyCodeLength', { defaultValue: 'Introduce un código de 6 dígitos' }));
      return;
    }

    enableMutation.mutate(
      { code: verificationCode.trim() },
      {
        onSuccess: (data) => {
          setShowSetupDialog(false);
          setBackupCodes(data.backup_codes || []);
          setShowBackupCodesDialog(true);
          refetchUser();
          toast.success(t('twoFactor.enabledBadge', { defaultValue: '2FA Activado con éxito' }));
        },
        onError: (err: any) => {
          toast.error(err?.message || t('twoFactor.invalidCode', { defaultValue: 'Código incorrecto' }));
        },
      }
    );
  };

  // 3. Desactivar 2FA
  const handleConfirmDisable = (e: React.FormEvent) => {
    e.preventDefault();

    if (disableMethod === 'totp' && (!disableCode || disableCode.trim().length !== 6)) {
      toast.error(t('twoFactor.verifyCodeLength', { defaultValue: 'Introduce un código de 6 dígitos' }));
      return;
    }
    if (disableMethod === 'password' && (!disablePassword || disablePassword.length === 0)) {
      toast.error('Introduce tu contraseña actual');
      return;
    }

    disableMutation.mutate(
      {
        code: disableMethod === 'totp' ? disableCode.trim() : null,
        password: disableMethod === 'password' ? disablePassword : null,
      },
      {
        onSuccess: () => {
          setShowDisableDialog(false);
          setDisableCode('');
          setDisablePassword('');
          refetchUser();
          toast.success(t('twoFactor.disabledSuccess', { defaultValue: 'Doble factor desactivado' }));
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Código 2FA o contraseña incorrectos');
        },
      }
    );
  };

  // 4. Regenerar Códigos de Respaldo
  const handleConfirmRegenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenerateCode || regenerateCode.trim().length !== 6) {
      toast.error(t('twoFactor.verifyCodeLength', { defaultValue: 'Introduce un código de 6 dígitos' }));
      return;
    }

    recoveryCodesMutation.mutate(
      { code: regenerateCode.trim() },
      {
        onSuccess: (data) => {
          setShowRegenerateDialog(false);
          setRegenerateCode('');
          setBackupCodes(data.backup_codes || []);
          setShowBackupCodesDialog(true);
          toast.success('Códigos de recuperación regenerados');
        },
        onError: (err: any) => {
          toast.error(err?.message || t('twoFactor.invalidCode', { defaultValue: 'Código incorrecto' }));
        },
      }
    );
  };

  // Copiar secreto manual
  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      toast.success(t('twoFactor.secretCopied', { defaultValue: 'Clave copiada al portapapeles' }));
    }
  };

  // Copiar códigos de respaldo
  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      toast.success(t('twoFactor.backupCodesCopied', { defaultValue: 'Códigos copiados al portapapeles' }));
    }
  };

  // Descargar códigos de respaldo como archivo .txt
  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const fileContent = `CÓDIGOS DE RECUPERACIÓN (2FA)\nFecha: ${new Date().toLocaleString()}\nUsuario: ${
      currentUser?.email || session?.user?.email || ''
    }\n\nATENCIÓN: Cada código es de un solo uso.\nGuarda este archivo en un lugar seguro.\n\n${backupCodes.join(
      '\r\n'
    )}\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-fastapi.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('twoFactor.backupCodesDownloaded', { defaultValue: 'Archivo descargado' }));
  };

  return (
    <Card className="max-w-2xl shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="size-5 text-primary" />
          {t('twoFactor.title', { defaultValue: 'Autenticación en dos pasos (2FA)' })}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {t('twoFactor.description', {
            defaultValue:
              'Añade una capa adicional de seguridad a tu cuenta utilizando una aplicación de autenticación TOTP.',
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-muted/40 gap-4">
          <div className="flex items-center gap-3">
            {isTwoFactorEnabled ? (
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="size-5" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-muted text-muted-foreground shrink-0">
                <ShieldOff className="size-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">
                {isTwoFactorEnabled
                  ? t('twoFactor.enabledBadge', { defaultValue: '2FA Activado' })
                  : t('twoFactor.disabledBadge', { defaultValue: '2FA Desactivado' })}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {isTwoFactorEnabled
                  ? t('twoFactor.enabledDesc', {
                      defaultValue: 'Tu cuenta está protegida con código de verificación TOTP.',
                    })
                  : t('twoFactor.disabledDesc', {
                      defaultValue: 'Activa el doble factor para prevenir accesos no autorizados.',
                    })}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isTwoFactorEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 w-fit'
                : 'text-muted-foreground w-fit'
            }
          >
            {isTwoFactorEnabled
              ? t('twoFactor.enabledBadge', { defaultValue: '2FA Activado' })
              : t('twoFactor.disabledBadge', { defaultValue: '2FA Desactivado' })}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center gap-3 border-t p-4 sm:p-6 bg-muted/20">
        {!isTwoFactorEnabled ? (
          <Button
            type="button"
            className="w-full sm:w-auto h-10 font-medium"
            onClick={handleOpenSetup}
            disabled={setupMutation.isPending}
          >
            {setupMutation.isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {t('profile.sending', { defaultValue: 'Cargando...' })}
              </>
            ) : (
              <span className="flex items-center gap-2">
                <QrCode className="size-4" />
                {t('twoFactor.setupButton', { defaultValue: 'Configurar 2FA' })}
              </span>
            )}
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-10"
              onClick={() => {
                setRegenerateCode('');
                setShowRegenerateDialog(true);
              }}
            >
              <RefreshCw className="mr-2 size-4" />
              {t('twoFactor.regenerateButton', { defaultValue: 'Regenerar Códigos de Respaldo' })}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto h-10"
              onClick={() => {
                setDisableCode('');
                setDisablePassword('');
                setShowDisableDialog(true);
              }}
            >
              {t('twoFactor.disableButton', { defaultValue: 'Desactivar 2FA' })}
            </Button>
          </div>
        )}
      </CardFooter>

      {/* DIÁLOGO 1: CONFIGURAR 2FA (QR & CÓDIGO) */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" />
              {t('twoFactor.setupTitle', { defaultValue: 'Configurar Autenticación en Dos Pasos' })}
            </DialogTitle>
            <DialogDescription>
              {t('twoFactor.setupDescription', {
                defaultValue:
                  'Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Microsoft Authenticator, 1Password, etc.) o introduce la clave secreta manualmente.',
              })}
            </DialogDescription>
          </DialogHeader>

          {setupMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <LoaderCircle className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando código QR...</p>
            </div>
          ) : setupData ? (
            <form onSubmit={handleConfirmEnable} className="space-y-4">
              {/* Imagen QR */}
              <div className="flex justify-center p-2 bg-white rounded-lg border shadow-xs">
                <img
                  src={setupData.qr_code_data_uri}
                  alt="Código QR 2FA"
                  className="size-48 object-contain"
                />
              </div>

              {/* Clave Secreta Manual */}
              <div className="flex flex-col gap-1.5">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t('twoFactor.secretKey', { defaultValue: 'Clave secreta (configuración manual)' })}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={setupData.secret}
                    className="font-mono text-xs tracking-wider bg-muted selection:bg-primary/20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                    title={t('twoFactor.copySecret', { defaultValue: 'Copiar clave' })}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Input Código de confirmación */}
              <div className="flex flex-col gap-1.5 pt-2">
                <FieldLabel htmlFor="setup-verify-code">
                  {t('twoFactor.verifyCode', { defaultValue: 'Código de verificación de 6 dígitos' })}
                </FieldLabel>
                <Input
                  id="setup-verify-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                  disabled={enableMutation.isPending}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSetupDialog(false)}
                  disabled={enableMutation.isPending}
                >
                  {t('common.cancel', { defaultValue: 'Cancelar' })}
                </Button>
                <Button
                  type="submit"
                  disabled={enableMutation.isPending || verificationCode.length !== 6}
                >
                  {enableMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      {t('twoFactor.verifying', { defaultValue: 'Verificando...' })}
                    </>
                  ) : (
                    t('twoFactor.verifyButton', { defaultValue: 'Activar 2FA' })
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO 2: CÓDIGOS DE RECUPERACIÓN (CRÍTICO) */}
      <Dialog
        open={showBackupCodesDialog}
        onOpenChange={(open) => {
          // No permitir cerrar accidentalmente haciendo clic fuera si aún no ha confirmado
          setShowBackupCodesDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="size-5 shrink-0" />
              <DialogTitle className="text-foreground">
                {t('twoFactor.backupCodesTitle', { defaultValue: 'Códigos de Recuperación' })}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-destructive font-medium leading-relaxed bg-destructive/10 p-2.5 rounded-md border border-destructive/20 mt-2">
              {t('twoFactor.backupCodesWarning', {
                defaultValue:
                  '¡Guarda estos códigos en un lugar seguro! Cada código solo se puede usar una vez si pierdes el acceso a tu aplicación de autenticación. No volverán a mostrarse en texto plano.',
              })}
            </DialogDescription>
          </DialogHeader>

          {/* Grid de Códigos */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg font-mono text-center text-sm font-semibold tracking-wider">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="p-2 bg-background rounded border text-foreground select-all shadow-2xs"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyBackupCodes}
              className="w-full"
            >
              <Copy className="mr-2 size-3.5" />
              {t('twoFactor.copyBackupCodes', { defaultValue: 'Copiar al portapapeles' })}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadBackupCodes}
              className="w-full"
            >
              <Download className="mr-2 size-3.5" />
              {t('twoFactor.downloadBackupCodes', { defaultValue: 'Descargar .txt' })}
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              className="w-full font-medium"
              onClick={() => setShowBackupCodesDialog(false)}
            >
              <Check className="mr-2 size-4" />
              {t('twoFactor.savedConfirmation', { defaultValue: 'He guardado mis códigos' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO 3: REGENERAR CÓDIGOS DE RECUPERACIÓN */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              {t('twoFactor.regenerateTitle', { defaultValue: 'Regenerar Códigos de Respaldo' })}
            </DialogTitle>
            <DialogDescription>
              {t('twoFactor.regenerateDescription', {
                defaultValue:
                  'Al regenerar los códigos, todos los códigos de respaldo anteriores quedarán invalidados inmediatamente. Introduce un código de tu app para confirmar.',
              })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRegenerate} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="regenerate-totp-code">
                {t('twoFactor.inputLabel', { defaultValue: 'Código de autenticación (TOTP)' })}
              </FieldLabel>
              <Input
                id="regenerate-totp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={regenerateCode}
                onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center font-mono text-lg tracking-widest"
                autoFocus
                disabled={recoveryCodesMutation.isPending}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegenerateDialog(false)}
                disabled={recoveryCodesMutation.isPending}
              >
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </Button>
              <Button
                type="submit"
                disabled={recoveryCodesMutation.isPending || regenerateCode.length !== 6}
              >
                {recoveryCodesMutation.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    {t('twoFactor.verifying', { defaultValue: 'Regenerando...' })}
                  </>
                ) : (
                  t('twoFactor.regenerateButton', { defaultValue: 'Regenerar Códigos' })
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO 4: DESACTIVAR 2FA (TOTP O CONTRASEÑA) */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5 shrink-0" />
              <DialogTitle className="text-foreground">
                {t('twoFactor.disableTitle', { defaultValue: 'Desactivar Autenticación en Dos Pasos' })}
              </DialogTitle>
            </div>
            <DialogDescription>
              {t('twoFactor.disableDescription', {
                defaultValue:
                  'Para confirmar la desactivación del 2FA, introduce un código de tu aplicación de autenticación o tu contraseña actual.',
              })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDisable} className="space-y-4">
            {/* Selector de Método */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium text-center">
              <button
                type="button"
                onClick={() => setDisableMethod('totp')}
                className={`py-1.5 rounded-md transition-all cursor-pointer ${
                  disableMethod === 'totp'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('twoFactor.totpMethod', { defaultValue: 'Código TOTP' })}
              </button>
              <button
                type="button"
                onClick={() => setDisableMethod('password')}
                className={`py-1.5 rounded-md transition-all cursor-pointer ${
                  disableMethod === 'password'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('twoFactor.passwordMethod', { defaultValue: 'Contraseña' })}
              </button>
            </div>

            {disableMethod === 'totp' ? (
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="disable-totp-code">
                  {t('twoFactor.inputLabel', { defaultValue: 'Código de autenticación (6 dígitos)' })}
                </FieldLabel>
                <Input
                  id="disable-totp-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                  disabled={disableMutation.isPending}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="disable-password">
                  {t('twoFactor.currentPassword', { defaultValue: 'Tu contraseña actual' })}
                </FieldLabel>
                <Input
                  id="disable-password"
                  type="password"
                  placeholder="••••••••"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoFocus
                  disabled={disableMutation.isPending}
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
                disabled={disableMutation.isPending}
              >
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  disableMutation.isPending ||
                  (disableMethod === 'totp' && disableCode.length !== 6) ||
                  (disableMethod === 'password' && disablePassword.length === 0)
                }
              >
                {disableMutation.isPending ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    {t('twoFactor.disabling', { defaultValue: 'Desactivando...' })}
                  </>
                ) : (
                  t('twoFactor.disableConfirmButton', { defaultValue: 'Confirmar Desactivación' })
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
