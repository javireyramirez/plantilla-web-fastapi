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
  if (normalized === 'companies') return `/companies/edit/${entityId}`;
  if (['users', 'teams', 'roles'].includes(normalized)) return `/admin/${normalized}/edit/${entityId}`;
  return null;
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

const DEFAULT_MODULE_LABELS: Record<string, string> = {
  users: 'Usuarios',
  user: 'Usuarios',
  companies: 'Compañías',
  company: 'Compañías',
  companie: 'Compañías',
  teams: 'Equipos',
  team: 'Equipos',
  roles: 'Roles',
  role: 'Roles',
  rbac: 'Roles y Permisos',
  documents: 'Documentos',
  document: 'Documentos',
  storage: 'Almacenamiento',
  audit: 'Auditoría',
  trash: 'Papelera',
  auth: 'Autenticación',
};

export function getAuditModuleLabel(
  t: (key: string) => string,
  moduleSlug: string | null | undefined,
  modulesMap?: Map<string, string>
): string {
  if (!moduleSlug) return '-';
  const raw = moduleSlug.toLowerCase().trim();
  const normalized = normalizeModuleSlug(raw);

  if (modulesMap) {
    if (modulesMap.has(normalized)) return modulesMap.get(normalized)!;
    if (modulesMap.has(raw)) return modulesMap.get(raw)!;
  }

  const key = `modules.names.${normalized}`;
  const translated = t(key);
  if (translated !== key) return translated;

  const rawKey = `modules.names.${raw}`;
  const rawTranslated = t(rawKey);
  if (rawTranslated !== rawKey) return rawTranslated;

  return DEFAULT_MODULE_LABELS[normalized] || DEFAULT_MODULE_LABELS[raw] || moduleSlug;
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
  const groupBusiness = t('modules.categories.business', { defaultValue: 'Negocio' });
  const groupFiles = t('modules.categories.files', { defaultValue: 'Archivos' });
  const groupSecurity = t('modules.categories.security', { defaultValue: 'Seguridad' });
  const groupSystem = t('modules.categories.system', { defaultValue: 'Sistema' });

  return [
    { value: 'companies', label: t('modules.names.companies', { defaultValue: 'Compañías' }), group: groupBusiness },
    { value: 'documents', label: t('modules.names.documents', { defaultValue: 'Documentos' }), group: groupFiles },
    { value: 'storage', label: t('modules.names.storage', { defaultValue: 'Almacenamiento' }), group: groupFiles },
    { value: 'users', label: t('modules.names.users', { defaultValue: 'Usuarios' }), group: groupSecurity },
    { value: 'teams', label: t('modules.names.teams', { defaultValue: 'Equipos' }), group: groupSecurity },
    { value: 'roles', label: t('modules.names.roles', { defaultValue: 'Roles' }), group: groupSecurity },
    { value: 'rbac', label: t('modules.names.rbac', { defaultValue: 'Roles y Permisos' }), group: groupSystem },
    { value: 'audit', label: t('modules.names.audit', { defaultValue: 'Auditoría' }), group: groupSystem },
    { value: 'trash', label: t('modules.names.trash', { defaultValue: 'Papelera' }), group: groupSystem },
  ];
}
