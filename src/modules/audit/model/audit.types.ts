export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export const NAVIGATABLE_MODULES = [
  'companies',
  'companie',
  'company',
  'users',
  'user',
  'teams',
  'team',
  'roles',
  'role',
];

export function normalizeModuleSlug(slug: string | null | undefined): string {
  if (!slug) return '';
  const s = slug.toLowerCase().trim();
  const map: Record<string, string> = {
    user: 'users',
    users: 'users',
    company: 'companies',
    companies: 'companies',
    companie: 'companies',
    role: 'roles',
    roles: 'roles',
    team: 'teams',
    teams: 'teams',
    document: 'documents',
    documents: 'documents',
    audit: 'audit',
    trash: 'trash',
    storage: 'storage',
    auth: 'auth',
  };
  return map[s] || s;
}

export function getEntityLink(
  moduleSlug: string | null | undefined,
  entityId: string | null | undefined
) {
  if (!moduleSlug || !entityId) return null;
  const normalized = normalizeModuleSlug(moduleSlug);
  if (!['companies', 'users', 'teams', 'roles'].includes(normalized)) return null;
  return `/${normalized}/edit/${entityId}`;
}

export function getAuditActionLabel(
  t: (key: string) => string,
  action: string | null | undefined,
  fallback?: string
): string {
  if (!action) return '-';
  const key = `audit.actions.${action}`;
  const translated = t(key);
  return translated !== key ? translated : (fallback || action);
}

export function getAuditModuleLabel(
  t: (key: string) => string,
  moduleSlug: string | null | undefined
): string {
  if (!moduleSlug) return '-';
  const raw = moduleSlug.toLowerCase().trim();
  const normalized = normalizeModuleSlug(raw);

  const key = `modules.names.${normalized}`;
  const translated = t(key);
  if (translated !== key) return translated;

  const rawKey = `modules.names.${raw}`;
  const rawTranslated = t(rawKey);
  if (rawTranslated !== rawKey) return rawTranslated;

  return moduleSlug;
}

export function getActionOptions(t: (key: string, options?: any) => string): SelectOption[] {
  const groupCreate = t('audit.actionGroups.createUpdate', { defaultValue: 'Creación y Edición' });
  const groupStatus = t('audit.actionGroups.status', { defaultValue: 'Estado' });
  const groupDeletion = t('audit.actionGroups.deletion', { defaultValue: 'Papelera y Eliminación' });
  const groupSession = t('audit.actionGroups.session', { defaultValue: 'Sesiones y Accesos' });

  return [
    { value: 'CREATE', label: getAuditActionLabel(t, 'CREATE', 'Crear'), group: groupCreate },
    { value: 'UPDATE', label: getAuditActionLabel(t, 'UPDATE', 'Actualizar'), group: groupCreate },
    { value: 'SUSPEND', label: getAuditActionLabel(t, 'SUSPEND', 'Suspender'), group: groupStatus },
    { value: 'REACTIVATE', label: getAuditActionLabel(t, 'REACTIVATE', 'Reactivar'), group: groupStatus },
    { value: 'TRASH', label: getAuditActionLabel(t, 'TRASH', 'Enviar a papelera'), group: groupDeletion },
    { value: 'RESTORE', label: getAuditActionLabel(t, 'RESTORE', 'Restaurar'), group: groupDeletion },
    { value: 'DELETE', label: getAuditActionLabel(t, 'DELETE', 'Eliminar'), group: groupDeletion },
    { value: 'PERMANENT_DELETE', label: getAuditActionLabel(t, 'PERMANENT_DELETE', 'Eliminar permanente'), group: groupDeletion },
    { value: 'LOGIN', label: getAuditActionLabel(t, 'LOGIN', 'Inicio de sesión'), group: groupSession },
    { value: 'LOGOUT', label: getAuditActionLabel(t, 'LOGOUT', 'Cierre de sesión'), group: groupSession },
  ];
}
export function getModuleOptions(t: (key: string, options?: any) => string): SelectOption[] {
  return [
    { value: 'users', label: t('modules.names.users', { defaultValue: 'Usuarios' }) },
    { value: 'teams', label: t('modules.names.teams', { defaultValue: 'Equipos' }) },
    { value: 'roles', label: t('modules.names.roles', { defaultValue: 'Roles' }) },
    { value: 'companies', label: t('modules.names.companies', { defaultValue: 'Empresas' }) },
    { value: 'documents', label: t('modules.names.documents', { defaultValue: 'Documentos' }) },
    { value: 'storage', label: t('modules.names.storage', { defaultValue: 'Almacenamiento' }) },
    { value: 'audit', label: t('modules.names.audit', { defaultValue: 'Auditoría' }) },
    { value: 'trash', label: t('modules.names.trash', { defaultValue: 'Papelera' }) },
  ];
}
