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
    rbac: 'roles',
    team: 'teams',
    teams: 'teams',
    document: 'storage',
    documents: 'storage',
    audit: 'audit',
    trash: 'trash',
    storage: 'storage',
    auth: 'users',
    session: 'users',
    sessions: 'users',
    setting: 'settings',
    settings: 'settings',
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
  if (normalized === 'settings') return `/admin/settings/edit/${entityId}`;
  if (normalized === 'audit') return `/admin/audit/${entityId}`;
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

export function getAuditModuleLabel(
  t: (key: string, options?: any) => string,
  moduleSlug: string | null | undefined,
  modulesMap?: Map<string, string>
): string {
  if (!moduleSlug) return '-';
  const raw = moduleSlug.toLowerCase().trim();
  const normalized = normalizeModuleSlug(raw);

  const fallbackFromModules =
    modulesMap?.get(normalized) || modulesMap?.get(raw) || moduleSlug;

  return t(`modules.names.${normalized}`, {
    defaultValue: t(`modules.names.${raw}`, {
      defaultValue: fallbackFromModules,
    }),
  });
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
