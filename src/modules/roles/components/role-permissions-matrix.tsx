// @/modules/roles/components/role-permissions-matrix.tsx
import {
  Briefcase,
  Cpu,
  FileText,
  Globe,
  Loader2,
  Save,
  Search,
  Shield,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { PermissionScopeType } from '../model/roles.schema';
import { useRolePermissionsMatrix } from '../model/use-role-permissions-matrix';

const ACTIONS = [
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'EXPORT',
  'IMPORT',
  'SETTINGS',
] as const;

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  business: Briefcase,
  files: FileText,
  security: Shield,
  system: Cpu,
};

const CATEGORY_ORDER = ['business', 'files', 'security', 'system'];

export function RolePermissionsMatrix({ roleId }: { roleId: string }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const {
    modules = [],
    isLoading,
    getEffectiveScope,
    setPendingScope,
    handleSave,
    handleCancel,
    hasChanges,
    isSaving,
    isMutating,
  } = useRolePermissionsMatrix(roleId);

  // Filter modules by search query (translated name or slug)
  const filteredModules = React.useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const query = searchQuery.toLowerCase().trim();
    return modules.filter((mod: any) => {
      const moduleName = t(`modules.names.${mod.slug}`, {
        defaultValue: mod.name || '',
      }).toLowerCase();
      const slug = mod.slug.toLowerCase();
      return moduleName.includes(query) || slug.includes(query);
    });
  }, [modules, searchQuery, t]);

  // Group filtered modules by category
  const groupedModules = React.useMemo(() => {
    const groups: Record<string, typeof filteredModules> = {};
    filteredModules.forEach((mod: any) => {
      const cat = mod.category || 'system';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(mod);
    });
    return groups;
  }, [filteredModules]);

  const sortedCategories = React.useMemo(() => {
    const categories = Object.keys(groupedModules);
    return CATEGORY_ORDER.filter((c) => categories.includes(c)).concat(
      categories.filter((c) => !CATEGORY_ORDER.includes(c))
    );
  }, [groupedModules]);

  if (isLoading) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('roles.permissions.loading')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{t('roles.permissions.matrixTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('roles.permissions.matrixDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="text-xs h-8"
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs h-8 gap-1.5"
              >
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                <Save className="h-4 w-4" />
                {t('common.save')}
              </Button>
            </>
          )}
          {isMutating && !hasChanges && (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-0.5 text-xs animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {isSaving ? t('roles.permissions.saving') : t('roles.permissions.syncing')}
            </Badge>
          )}
        </div>
      </div>

      {modules.length > 0 && (
        <div className="p-4 border-b bg-muted/10 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('roles.permissions.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12 text-muted-foreground">
          <ShieldAlert className="h-4 w-4" />
          <span className="text-sm">{t('roles.permissions.noModules')}</span>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12 text-muted-foreground">
          <Search className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-sm">
            {t('roles.permissions.noModulesFound', {
              defaultValue: 'No se encontraron módulos que coincidan con la búsqueda.',
            })}
          </span>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={sortedCategories} className="w-full">
          {sortedCategories.map((category) => {
            const categoryModules = groupedModules[category] || [];
            const Icon = CATEGORY_ICONS[category] || Cpu;

            return (
              <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 hover:bg-muted/10 hover:no-underline transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        {t(`modules.categories.${category}`)}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({categoryModules.length}{' '}
                        {categoryModules.length === 1
                          ? t('roles.permissions.moduleCountOne', { defaultValue: 'módulo' })
                          : t('roles.permissions.moduleCountOther', { defaultValue: 'módulos' })}
                        )
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="overflow-x-auto border-t bg-muted/5">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-[220px] font-bold text-foreground">
                            {t('roles.permissions.moduleCol')}
                          </TableHead>
                          {ACTIONS.map((action) => (
                            <TableHead
                              key={action}
                              className="text-center min-w-[120px] font-medium text-xs"
                            >
                              {action}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryModules.map((mod: any) => {
                          const moduleName = t(`modules.names.${mod.slug}`, {
                            defaultValue: mod.name || t('roles.permissions.unknownModule'),
                          });

                          return (
                            <TableRow key={mod.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-medium min-w-[200px]">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-foreground">
                                    {moduleName}
                                  </span>
                                </div>
                              </TableCell>

                              {ACTIONS.map((action) => {
                                const currentValue = getEffectiveScope(mod.id, action);

                                return (
                                  <TableCell key={action} className="p-2 text-center">
                                    <Select
                                      disabled={isSaving}
                                      value={currentValue}
                                      onValueChange={(val) =>
                                        setPendingScope(
                                          mod.id,
                                          action,
                                          val as PermissionScopeType | 'NONE'
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        className={cn(
                                          'h-8 w-full text-xs font-medium border-dashed bg-transparent transition-all',
                                          currentValue === 'NONE' &&
                                            'text-muted-foreground border-transparent hover:border-input',
                                          currentValue === 'OWN' &&
                                            'border-blue-200 text-blue-600 bg-blue-50/30 dark:bg-blue-950/20',
                                          currentValue === 'TEAM' &&
                                            'border-purple-200 text-purple-600 bg-purple-50/30 dark:bg-purple-950/20',
                                          currentValue === 'GLOBAL' &&
                                            'border-emerald-200 text-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                                        )}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent align="center">
                                        <SelectItem
                                          value="NONE"
                                          className="text-xs text-muted-foreground focus:text-destructive"
                                        >
                                          <X /> {t('roles.scopes.none')}
                                        </SelectItem>
                                        <SelectItem value="OWN" className="text-xs text-blue-600">
                                          <User /> {t('roles.scopes.own')}
                                        </SelectItem>
                                        <SelectItem
                                          value="TEAM"
                                          className="text-xs text-purple-600"
                                        >
                                          <Users /> {t('roles.scopes.team')}
                                        </SelectItem>
                                        <SelectItem
                                          value="GLOBAL"
                                          className="text-xs text-emerald-600"
                                        >
                                          <Globe /> {t('roles.scopes.global')}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
