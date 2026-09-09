export interface SelectOption {
  value: string;
  label: string;
}

export const NAVIGATABLE_MODULES = ['companies', 'users', 'teams', 'roles'];

export function getEntityLink(
  moduleSlug: string | null | undefined,
  entityId: string | null | undefined
) {
  if (!moduleSlug || !entityId || !NAVIGATABLE_MODULES.includes(moduleSlug)) return null;
  return `/${moduleSlug}/edit/${entityId}`;
}

export function getActionOptions(t: (key: string) => string): SelectOption[] {
  return [
    { value: 'CREATE', label: t('audit.actions.CREATE') },
    { value: 'UPDATE', label: t('audit.actions.UPDATE') },
    { value: 'SOFT_DELETE', label: t('audit.actions.SOFT_DELETE') },
    { value: 'RESTORE', label: t('audit.actions.RESTORE') },
    { value: 'HARD_DELETE', label: t('audit.actions.HARD_DELETE') },
    { value: 'LOGIN', label: t('audit.actions.LOGIN') },
    { value: 'LOGOUT', label: t('audit.actions.LOGOUT') },
  ];
}
export function getModuleOptions(t: (key: string) => string): SelectOption[] {
  return [
    { value: 'companies', label: t('modules.names.companies') },
    { value: 'users', label: t('modules.names.users') },
    { value: 'teams', label: t('modules.names.teams') },
    { value: 'roles', label: t('modules.names.roles') },
    { value: 'audit', label: t('modules.names.audit') },
    { value: 'documents', label: t('modules.names.documents') },
  ];
}
