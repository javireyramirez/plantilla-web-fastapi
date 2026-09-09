export interface SelectOption {
  value: string;
  label: string;
}

export const NAVIGATABLE_MODULES = ['companies', 'companie', 'users', 'teams', 'roles'];

export function getEntityLink(
  moduleSlug: string | null | undefined,
  entityId: string | null | undefined
) {
  if (!moduleSlug || !entityId) return null;
  const normalized = moduleSlug === 'companie' ? 'companies' : moduleSlug;
  if (!['companies', 'users', 'teams', 'roles'].includes(normalized)) return null;
  return `/${normalized}/edit/${entityId}`;
}

export function getActionOptions(t: (key: string) => string): SelectOption[] {
  return [
    { value: 'CREATE', label: t('audit.actions.CREATE') || 'Crear' },
    { value: 'UPDATE', label: t('audit.actions.UPDATE') || 'Actualizar' },
    { value: 'DELETE', label: t('audit.actions.DELETE') || 'Eliminar' },
    { value: 'TRASH', label: t('audit.actions.TRASH') || 'Enviar a papelera' },
    { value: 'RESTORE', label: t('audit.actions.RESTORE') || 'Restaurar' },
    { value: 'SOFT_DELETE', label: t('audit.actions.SOFT_DELETE') || 'Borrado lógico' },
    { value: 'HARD_DELETE', label: t('audit.actions.HARD_DELETE') || 'Borrado permanente' },
    { value: 'LOGIN', label: t('audit.actions.LOGIN') || 'Inicio de sesión' },
    { value: 'LOGOUT', label: t('audit.actions.LOGOUT') || 'Cierre de sesión' },
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
