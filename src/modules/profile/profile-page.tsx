import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import FormFieldWrapper from '@/components/form/form-field-wrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/config/auth-client';
import { useChangePassword, useCurrentUser, useSendVerificationEmail } from '@/hooks/use-auth';
import {
  ChangePasswordSchema,
  ChangePasswordSchemaValues,
} from '@/modules/auth/model/auth.schema';
import TwoFactorSettings from '@/modules/profile/components/two-factor-settings';

export default function Profile() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: currentUser } = useCurrentUser();

  const [activeTab, setActiveTab] = useState('general');

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    new_password: false,
    confirmPassword: false,
  });

  const toggleVisibility = (
    field: 'new_password' | 'confirmPassword' | 'currentPassword'
  ) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const useChangePasswordMutation = useChangePassword();
  const {
    mutate: sendEmail,
    isPending: isPendingMail,
    isSuccess: isSuccessMail,
  } = useSendVerificationEmail();

  const form = useForm<ChangePasswordSchemaValues>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      currentPassword: '',
      new_password: '',
      confirmPassword: '',
      revokeOtherSessions: false,
    },
  });

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            className="h-8 w-8 animate-spin text-primary"
            aria-label={t('nav.loadingAria', { defaultValue: 'Cargando...' })}
          />
          <p className="text-sm text-muted-foreground">{t('nav.verifyingSession', { defaultValue: 'Verificando sesión...' })}</p>
        </div>
      </div>
    );
  }

  const user = currentUser || session.user;
  const isVerified = Boolean(user.emailVerified);

  const getUserInitials = () => {
    if (user.name) {
      const names = user.name.trim().split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const onSubmitPassword = (data: ChangePasswordSchemaValues) => {
    useChangePasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('profile.toast.passwordChanged', { defaultValue: 'Contraseña cambiada correctamente' }));
        form.reset();
      },
      onError: (error: any) => {
        toast.error(error?.message || t('profile.toast.passwordChangeFailed', { defaultValue: 'Error al cambiar la contraseña' }));
      },
    });
  };

  const isSubmittingPassword = useChangePasswordMutation.isPending;

  const handleVerificationEmail = () => {
    if (!user.email) {
      toast.error(t('profile.toast.noEmailFound', { defaultValue: 'No se encontró correo electrónico' }));
      return;
    }

    sendEmail(
      { email: user.email },
      {
        onSuccess: () => toast.success(t('profile.toast.verificationSent', { defaultValue: 'Correo de verificación enviado' })),
        onError: (error: any) => toast.error(error?.message || t('profile.toast.sendError', { defaultValue: 'Error al enviar el correo' })),
      }
    );
  };

  // Configuración de las pestañas internas del perfil
  const tabs = [
    {
      value: 'general',
      label: t('profile.tabs.general', { defaultValue: 'General' }),
      icon: <User className="size-4" />,
    },
    {
      value: 'security',
      label: t('profile.tabs.security', { defaultValue: 'Seguridad' }),
      icon: <Lock className="size-4" />,
    },
    {
      value: 'two-factor',
      label: t('profile.tabs.twoFactor', { defaultValue: 'Doble Factor (2FA)' }),
      icon: <ShieldCheck className="size-4" />,
    },
  ];

  const currentTab = tabs.find((t) => t.value === activeTab) || tabs[0];

  return (
    <div className="space-y-6 mx-auto p-4 md:p-6 max-w-5xl">
      {/* SECCIÓN 1: Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/home">{t('sidebar.home', { defaultValue: 'Inicio' })}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                {t('nav.profile', { defaultValue: 'Perfil' })}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* SECCIÓN 2: Header de Perfil */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 md:p-6 rounded-xl border shadow-xs">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="size-14 border shadow-xs shrink-0">
            {user.image && <AvatarImage src={user.image} alt={user.name || ''} />}
            <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 truncate">
              {user.name || t('nav.profile', { defaultValue: 'Perfil de Usuario' })}
            </h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Navegación por Subpestañas (Tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Vista Escritorio */}
        <TabsList
          variant="line"
          className="hidden md:flex h-auto w-fit justify-start gap-6 rounded-none border-b bg-transparent p-0"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-0 w-36 shrink-0 gap-2 font-medium"
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Vista Móvil */}
        <div className="border-b md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-0 text-base font-medium gap-2">
                {currentTab?.icon}
                {currentTab?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="gap-2 cursor-pointer"
                >
                  {tab.icon}
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CONTENIDO PESTAÑA 1: GENERAL */}
        <TabsContent value="general" className="outline-none space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta: Información de la Cuenta */}
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  {t('profile.accountInfo', { defaultValue: 'Información de la Cuenta' })}
                </CardTitle>
                <CardDescription>
                  {t('profile.accountInfoDesc', {
                    defaultValue: 'Datos básicos vinculados a tu cuenta en la plataforma.',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <FieldLabel className="text-xs text-muted-foreground">{t('auth.name', { defaultValue: 'Nombre' })}</FieldLabel>
                  <Input value={user.name || ''} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-xs text-muted-foreground">{t('auth.email', { defaultValue: 'Email' })}</FieldLabel>
                  <Input value={user.email || ''} readOnly className="bg-muted/50" />
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta: Verificación de Correo */}
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="size-5 text-primary" />
                  {t('profile.emailVerification', { defaultValue: 'Verificación de Correo' })}
                </CardTitle>
                <CardDescription>
                  {t('profile.emailVerificationDesc', {
                    defaultValue: 'Estado de verificación de tu dirección de email principal.',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/40">
                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <MailCheck className="size-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <Mail className="size-5" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {isVerified
                          ? t('profile.emailVerified', { defaultValue: 'Correo Verificado' })
                          : t('profile.emailUnverified', { defaultValue: 'Correo Pendiente' })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isVerified
                          ? t('profile.emailVerifiedDesc', { defaultValue: 'Tu dirección de correo ha sido confirmada.' })
                          : t('profile.emailUnverifiedDesc', { defaultValue: 'Confirma tu correo para acceder a todas las funciones.' })}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isVerified
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }
                  >
                    {isVerified
                      ? t('profile.emailVerified', { defaultValue: 'Verificado' })
                      : t('profile.emailPending', { defaultValue: 'Pendiente' })}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 border-t p-4 sm:p-6 bg-muted/20">
                <Button
                  type="button"
                  variant={isVerified ? 'outline' : 'default'}
                  className="w-full sm:w-auto h-10 font-medium"
                  onClick={handleVerificationEmail}
                  disabled={isPendingMail || isVerified || isSuccessMail}
                >
                  {isVerified ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      {t('profile.emailVerified', { defaultValue: 'Correo Verificado' })}
                    </span>
                  ) : isPendingMail ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.sending', { defaultValue: 'Enviando enlace...' })}
                    </>
                  ) : isSuccessMail ? (
                    t('profile.sentSuccessfully', { defaultValue: '¡Enlace Enviado!' })
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="size-4" />
                      {t('profile.sendVerificationLink', { defaultValue: 'Enviar enlace de verificación' })}
                    </span>
                  )}
                </Button>

                {!isVerified && isSuccessMail && (
                  <p className="text-xs text-muted-foreground animate-in fade-in">
                    {t('profile.checkInboxOrSpam', {
                      defaultValue: 'Revisa tu bandeja de entrada o carpeta de correo no deseado.',
                    })}
                  </p>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* CONTENIDO PESTAÑA 2: SEGURIDAD (CONTRASEÑA) */}
        <TabsContent value="security" className="outline-none space-y-6">
          <Card className="max-w-2xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                {t('profile.changePassword', { defaultValue: 'Cambio de Contraseña' })}
              </CardTitle>
              <CardDescription>
                {t('profile.changePasswordDesc', {
                  defaultValue:
                    'Asegúrate de utilizar una contraseña segura que combine mayúsculas, minúsculas, números y símbolos.',
                })}
              </CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmitPassword)}>
              <CardContent className="space-y-4">
                {/* Contraseña Actual */}
                <div className="space-y-1">
                  <Controller
                    name="currentPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper fieldState={fieldState}>
                        <FieldLabel htmlFor="currentPassword">
                          {t('profile.currentPassword', { defaultValue: 'Contraseña actual' })}
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            className="pr-10"
                            id="currentPassword"
                            type={showPassword.currentPassword ? 'text' : 'password'}
                            aria-invalid={fieldState.invalid}
                            autoComplete="current-password"
                            disabled={isSubmittingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleVisibility('currentPassword')}
                            disabled={isSubmittingPassword}
                            aria-label={
                              showPassword.currentPassword
                                ? t('profile.hidePassword', { defaultValue: 'Ocultar contraseña' })
                                : t('profile.showPassword', { defaultValue: 'Mostrar contraseña' })
                            }
                          >
                            {showPassword.currentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormFieldWrapper>
                    )}
                  />
                </div>

                {/* Nueva Contraseña */}
                <div className="space-y-1">
                  <Controller
                    name="new_password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper fieldState={fieldState}>
                        <FieldLabel htmlFor="new_password">
                          {t('profile.newPassword', { defaultValue: 'Nueva contraseña' })}
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            className="pr-10"
                            id="new_password"
                            type={showPassword.new_password ? 'text' : 'password'}
                            aria-invalid={fieldState.invalid}
                            autoComplete="new-password"
                            disabled={isSubmittingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleVisibility('new_password')}
                            disabled={isSubmittingPassword}
                            aria-label={
                              showPassword.new_password
                                ? t('profile.hidePassword', { defaultValue: 'Ocultar contraseña' })
                                : t('profile.showPassword', { defaultValue: 'Mostrar contraseña' })
                            }
                          >
                            {showPassword.new_password ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormFieldWrapper>
                    )}
                  />
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-1">
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormFieldWrapper fieldState={fieldState}>
                        <FieldLabel htmlFor="confirmPassword">
                          {t('profile.repeatPassword', { defaultValue: 'Repetir contraseña' })}
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            className="pr-10"
                            id="confirmPassword"
                            type={showPassword.confirmPassword ? 'text' : 'password'}
                            aria-invalid={fieldState.invalid}
                            autoComplete="new-password"
                            disabled={isSubmittingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => toggleVisibility('confirmPassword')}
                            disabled={isSubmittingPassword}
                            aria-label={
                              showPassword.confirmPassword
                                ? t('profile.hidePassword', { defaultValue: 'Ocultar contraseña' })
                                : t('profile.showPassword', { defaultValue: 'Mostrar contraseña' })
                            }
                          >
                            {showPassword.confirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormFieldWrapper>
                    )}
                  />
                </div>

                {/* Revocar Otras Sesiones */}
                <Controller
                  name="revokeOtherSessions"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="revokeOtherSessions"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmittingPassword}
                        />
                        <label
                          htmlFor="revokeOtherSessions"
                          className="text-sm font-medium cursor-pointer"
                        >
                          {t('profile.revokeOtherSessions', {
                            defaultValue: 'Cerrar sesión en el resto de dispositivos',
                          })}
                        </label>
                      </div>
                      {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                    </div>
                  )}
                />
              </CardContent>

              <CardFooter className="border-t p-4 sm:p-6 bg-muted/20">
                <Button
                  type="submit"
                  className="w-full sm:w-auto font-medium"
                  disabled={isSubmittingPassword}
                >
                  {isSubmittingPassword ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.updating', { defaultValue: 'Actualizando...' })}
                    </>
                  ) : (
                    t('profile.updatePassword', { defaultValue: 'Actualizar Contraseña' })
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* CONTENIDO PESTAÑA 3: DOBLE FACTOR (2FA) */}
        <TabsContent value="two-factor" className="outline-none space-y-6">
          <TwoFactorSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
