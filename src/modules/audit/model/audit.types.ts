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
  const groupMembersTeams = t('audit.actionGroups.membersTeams', { defaultValue: 'Miembros y Equipos' });
  const groupRolesPermissions = t('audit.actionGroups.rolesPermissions', { defaultValue: 'Roles y Permisos' });

  return [
    // Creación y Edición
    { value: 'CREATE', label: getAuditActionLabel(t, 'CREATE', 'Crear'), group: groupCreate },
    { value: 'UPDATE', label: getAuditActionLabel(t, 'UPDATE', 'Actualizar'), group: groupCreate },
    { value: 'BULK_CREATE', label: getAuditActionLabel(t, 'BULK_CREATE', 'Creación masiva'), group: groupCreate },
    { value: 'CREATE_MODULE', label: getAuditActionLabel(t, 'CREATE_MODULE', 'Crear módulo'), group: groupCreate },
    { value: 'SETTINGS_CHANGE', label: getAuditActionLabel(t, 'SETTINGS_CHANGE', 'Cambio de configuración'), group: groupCreate },

    // Estado
    { value: 'ACTIVATE', label: getAuditActionLabel(t, 'ACTIVATE', 'Activar'), group: groupStatus },
    { value: 'REACTIVATE', label: getAuditActionLabel(t, 'REACTIVATE', 'Reactivar'), group: groupStatus },
    { value: 'SUSPEND', label: getAuditActionLabel(t, 'SUSPEND', 'Suspender'), group: groupStatus },

    // Miembros y Equipos
    { value: 'ADD_MEMBER', label: getAuditActionLabel(t, 'ADD_MEMBER', 'Añadir miembro'), group: groupMembersTeams },
    { value: 'UPDATE_MEMBER', label: getAuditActionLabel(t, 'UPDATE_MEMBER', 'Actualizar miembro'), group: groupMembersTeams },
    { value: 'REMOVE_MEMBER', label: getAuditActionLabel(t, 'REMOVE_MEMBER', 'Eliminar miembro'), group: groupMembersTeams },
    { value: 'ASSIGN_TEAMS', label: getAuditActionLabel(t, 'ASSIGN_TEAMS', 'Asignar equipos'), group: groupMembersTeams },
    { value: 'REMOVE_TEAMS', label: getAuditActionLabel(t, 'REMOVE_TEAMS', 'Desasignar equipos'), group: groupMembersTeams },

    // Roles y Permisos
    { value: 'ASSIGN_ROLE', label: getAuditActionLabel(t, 'ASSIGN_ROLE', 'Asignar rol'), group: groupRolesPermissions },
    { value: 'ASSIGN_ROLES', label: getAuditActionLabel(t, 'ASSIGN_ROLES', 'Asignar roles'), group: groupRolesPermissions },
    { value: 'UNASSIGN_ROLE', label: getAuditActionLabel(t, 'UNASSIGN_ROLE', 'Desasignar rol'), group: groupRolesPermissions },
    { value: 'UNASSIGN_ROLES', label: getAuditActionLabel(t, 'UNASSIGN_ROLES', 'Desasignar roles'), group: groupRolesPermissions },
    { value: 'SET_ROLE_PERMISSIONS', label: getAuditActionLabel(t, 'SET_ROLE_PERMISSIONS', 'Establecer permisos de rol'), group: groupRolesPermissions },

    // Papelera y Eliminación
    { value: 'TRASH', label: getAuditActionLabel(t, 'TRASH', 'Enviar a papelera'), group: groupDeletion },
    { value: 'RESTORE', label: getAuditActionLabel(t, 'RESTORE', 'Restaurar'), group: groupDeletion },
    { value: 'DELETE', label: getAuditActionLabel(t, 'DELETE', 'Eliminar'), group: groupDeletion },
    { value: 'PERMANENT_DELETE', label: getAuditActionLabel(t, 'PERMANENT_DELETE', 'Eliminar permanente'), group: groupDeletion },
    { value: 'PURGE', label: getAuditActionLabel(t, 'PURGE', 'Purgar'), group: groupDeletion },
    { value: 'BULK_TRASH', label: getAuditActionLabel(t, 'BULK_TRASH', 'Envío masivo a papelera'), group: groupDeletion },
    { value: 'BULK_RESTORE', label: getAuditActionLabel(t, 'BULK_RESTORE', 'Restauración masiva'), group: groupDeletion },

    // Sesiones y Accesos
    { value: 'LOGIN', label: getAuditActionLabel(t, 'LOGIN', 'Iniciar sesión'), group: groupSession },
    { value: 'LOGIN_FAILED', label: getAuditActionLabel(t, 'LOGIN_FAILED', 'Intento de inicio de sesión fallido'), group: groupSession },
    { value: 'LOGOUT', label: getAuditActionLabel(t, 'LOGOUT', 'Cierre de sesión'), group: groupSession },
    { value: 'IMPERSONATE', label: getAuditActionLabel(t, 'IMPERSONATE', 'Suplantar identidad'), group: groupSession },
    { value: 'PASSWORD_CHANGE', label: getAuditActionLabel(t, 'PASSWORD_CHANGE', 'Cambio de contraseña'), group: groupSession },
    { value: 'RESEND_INVITATION', label: getAuditActionLabel(t, 'RESEND_INVITATION', 'Reenviar invitación'), group: groupSession },
  ];
}
