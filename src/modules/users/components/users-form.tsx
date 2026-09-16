import { Eye, EyeOff, Mail, Shield } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useState } from 'react';

import FormFieldWrapper from '@/components/form/form-field-wrapper.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/use-permissions';
import { rolesQueries } from '@/modules/roles/model/roles.query';

interface UsersDetailFormProps {
  isEditing: boolean;
  isActive: boolean;
}

export function UsersDetailForm({ isEditing, isActive }: UsersDetailFormProps) {
  const { t } = useTranslation();
  const form = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const { isSuperAdmin: currentUserIsSuperAdmin } = usePermissions();

  const sendInvitation = form.watch('send_invitation_email');
  const selectedRoles: string[] = form.watch('role_ids') || [];

  const { data: rolesData, isLoading: isLoadingRoles } = rolesQueries.useGetAll(
    { isTrash: false, limit: 100 } as any,
    { enabled: !isEditing }
  );
  const availableRoles = rolesData?.data ?? [];

  const toggleRole = (roleId: string) => {
    const current: string[] = form.getValues('role_ids') || [];
    if (current.includes(roleId)) {
      form.setValue(
        'role_ids',
        current.filter((id) => id !== roleId),
        { shouldDirty: true, shouldValidate: true }
      );
    } else {
      form.setValue('role_ids', [...current, roleId], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* 1. Datos Básicos */}
      <Card
        className={`shadow-sm transition-all duration-300 relative ${
          isEditing && !isActive ? 'pointer-events-none select-none opacity-70' : ''
        }`}
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('users.basicData')}</CardTitle>
          <CardDescription>{t('users.identificationInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="user-form-id" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FieldGroup className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="user-name"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('users.name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-name"
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldWrapper fieldState={fieldState}>
                    <FieldLabel
                      htmlFor="user-email"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {t('users.email')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-email"
                      disabled={isEditing}
                      aria-invalid={fieldState.invalid}
                      data-invalid={fieldState.invalid}
                      autoComplete="off"
                      className="mt-1.5 focus-visible:ring-primary"
                    />
                  </FormFieldWrapper>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Secciones de Creación: Acceso, Contraseña y Permisos */}
      {!isEditing && (
        <>
          {/* 2. Acceso y Contraseña */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('users.authAndAccess')}</CardTitle>
              <CardDescription>{t('users.authAndAccessDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="send_invitation_email"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-2xs">
                    <div className="space-y-0.5 pr-4">
                      <FieldLabel
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="send-invite-toggle"
                      >
                        {t('users.sendInvitationEmail')}
                      </FieldLabel>
                      <p className="text-xs text-muted-foreground">
                        {t('users.sendInvitationDesc')}
                      </p>
                    </div>
                    <Switch
                      id="send-invite-toggle"
                      checked={!!field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue('password', '', { shouldValidate: true });
                        }
                      }}
                    />
                  </div>
                )}
              />

              {sendInvitation ? (
                <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                  <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p>{t('users.invitationNotice')}</p>
                </div>
              ) : (
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormFieldWrapper fieldState={fieldState}>
                      <FieldLabel
                        htmlFor="user-password"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {t('users.password')}
                      </FieldLabel>
                      <div className="relative mt-1.5">
                        <Input
                          {...field}
                          id="user-password"
                          type={showPassword ? 'text' : 'password'}
                          aria-invalid={fieldState.invalid}
                          data-invalid={fieldState.invalid}
                          autoComplete="new-password"
                          placeholder={t('users.passwordPlaceholder')}
                          className="pr-10 focus-visible:ring-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                          onClick={() => setShowPassword((prev) => !prev)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('users.passwordHelp')}
                      </p>
                    </FormFieldWrapper>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* 3. Estado Inicial y Roles */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('users.statusAndRoles')}</CardTitle>
              <CardDescription>{t('users.statusAndRolesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="is_active"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-2xs">
                    <div className="space-y-0.5">
                      <FieldLabel
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="is-active-toggle"
                      >
                        {t('users.isActive')}
                      </FieldLabel>
                      <p className="text-xs text-muted-foreground">
                        {field.value ? t('users.active') : t('users.inactive')}
                      </p>
                    </div>
                    <Switch
                      id="is-active-toggle"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              <Controller
                name="is_super_admin"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-2xs">
                    <div className="space-y-0.5 pr-4">
                      <FieldLabel
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="is-super-admin-toggle"
                      >
                        {t('users.isSuperAdmin')}
                      </FieldLabel>
                      <p className="text-xs text-muted-foreground">
                        {t('users.isSuperAdminDesc')}
                      </p>
                    </div>
                    <Switch
                      id="is-super-admin-toggle"
                      disabled={!currentUserIsSuperAdmin}
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              <div className="space-y-2 pt-2">
                <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('users.rolesSelect')}
                </FieldLabel>
                {availableRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {availableRoles.map((r: any) => {
                      const isSelected = selectedRoles.includes(r.id);
                      return (
                        <Badge
                          key={r.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer transition-all hover:opacity-80 select-none py-1.5 px-3 gap-1.5 text-xs font-medium"
                          onClick={() => toggleRole(r.id)}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {r.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {isLoadingRoles
                      ? t('general.loading', { defaultValue: 'Cargando...' })
                      : t('roles.noRolesFound')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

