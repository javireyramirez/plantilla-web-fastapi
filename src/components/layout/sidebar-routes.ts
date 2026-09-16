import {
  Briefcase,
  Building2,
  Cpu,
  FileText,
  HardDrive,
  History,
  LayoutGrid,
  Loader2,
  Monitor,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export const MODULE_ROUTE_MAP: Record<string, string> = {
  companies: '/companies',
  users: '/admin/users',
  teams: '/admin/teams',
  roles: '/admin/roles',
  settings: '/admin/settings',
  sessions: '/admin/sessions',
  audit: '/admin/audit',
  storage: '/admin/storage',
  documents: '/admin/recovery',
  trash: '/admin/recovery',
  recovery: '/admin/recovery',
  jobs: '/admin/jobs',
};

export const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  building: Building2,
  companies: Building2,
  users: User,
  'users-round': UsersRound,
  teams: Users,
  shield: Shield,
  roles: Shield,
  file: FileText,
  'file-text': FileText,
  documents: FileText,
  'hard-drive': HardDrive,
  storage: HardDrive,
  history: History,
  audit: History,
  'trash-2': RotateCcw,
  trash: RotateCcw,
  recovery: RotateCcw,
  cpu: Cpu,
  system: Cpu,
  sliders: SlidersHorizontal,
  settings: SlidersHorizontal,
  loader: Loader2,
  jobs: Loader2,
  monitor: Monitor,
  sessions: Monitor,
};

export function getModuleIcon(iconName?: string | null, moduleCode?: string): LucideIcon {
  if (iconName && MODULE_ICON_MAP[iconName]) return MODULE_ICON_MAP[iconName];
  if (moduleCode && MODULE_ICON_MAP[moduleCode]) return MODULE_ICON_MAP[moduleCode];
  return LayoutGrid;
}

export function getModuleRoute(moduleCode: string): string {
  const clean = (moduleCode || '').toLowerCase().trim();
  return MODULE_ROUTE_MAP[clean] || `/${clean}`;
}

