import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import logo from '@/assets/logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar.js';
import usePermissions from '@/hooks/use-permissions';
import { useModules } from '@/modules/modules/model/modules.query';

import NavUser from './nav-user.js';
import { getModuleIcon, getModuleRoute } from './sidebar-routes.js';

interface CategoryGroup {
  category: string;
  categoryName: string;
  categoryOrder: number;
  items: Array<{
    code: string;
    name: string;
    url: string;
    icon: ReturnType<typeof getModuleIcon>;
    sortOrder: number;
  }>;
}

export default function LayoutSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const { modules, isLoading: isLoadingModules } = useModules();
  const { can, isSuperAdmin, isLoading: isLoadingPermissions } = usePermissions();

  const isAdminSection = location.pathname.startsWith('/admin');

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  // Construir navegación dinámica filtrada por sección (Negocio vs Admin)
  const navigationGroups = useMemo(() => {
    if (!modules || modules.length === 0) return [];

    const categoryMap = new Map<string, CategoryGroup>();

    modules.forEach((mod: any) => {
      const code = (mod.code || mod.slug || '').toLowerCase().trim();
      if (!code) return;

      // Omitir módulos abstractos/embebidos
      if (code === 'rbac' || code === 'auth' || code === 'documents') return;

      // Comprobar si el módulo está activo y el usuario tiene permiso de lectura
      const isActive = mod.isActive !== false;
      const hasReadAccess = isSuperAdmin || can(code, 'READ');
      if (!isActive || !hasReadAccess) return;

      const categoryKey = (mod.category || 'system').toLowerCase();

      // En la sección principal sólo van módulos de "business".
      // En la sección /admin van los módulos de gobernanza y sistema ("security", "system", "files", etc.).
      const belongsToAdmin = categoryKey === 'security' || categoryKey === 'system' || categoryKey === 'files';
      if (isAdminSection !== belongsToAdmin) return;

      const categoryName = mod.categoryName || mod.category_name || categoryKey;
      const categoryOrder = mod.categoryOrder ?? mod.category_order ?? 99;

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          category: categoryKey,
          categoryName,
          categoryOrder,
          items: [],
        });
      }

      categoryMap.get(categoryKey)!.items.push({
        code,
        name: mod.name || code,
        url: getModuleRoute(code),
        icon: getModuleIcon(mod.icon, code),
        sortOrder: mod.sortOrder ?? mod.sort_order ?? 0,
      });
    });

    // Ordenar categorías por categoryOrder y luego alfabéticamente
    const groups = Array.from(categoryMap.values()).sort(
      (a, b) => a.categoryOrder - b.categoryOrder || a.categoryName.localeCompare(b.categoryName)
    );

    // Ordenar items dentro de cada grupo por sortOrder
    groups.forEach((g) => {
      g.items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    });

    return groups;
  }, [modules, can, isSuperAdmin, isAdminSection]);

  // Saber si el usuario tiene acceso a administración para mostrar el enlace
  const hasAdminAccess = useMemo(() => {
    if (isSuperAdmin) return true;
    return ['users', 'roles', 'teams', 'audit', 'trash', 'storage'].some((mod) => can(mod, 'READ'));
  }, [isSuperAdmin, can]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2 md:hidden">
          <span className="flex flex-row items-center">
            <img src={logo} alt="logo" className="size-8 object-contain" />
          </span>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => {
          const groupTitle = t(`modules.categories.${group.category}`, {
            defaultValue: group.categoryName,
          });

          return (
            <SidebarGroup key={group.category}>
              <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isItemActive =
                      location.pathname === item.url ||
                      (item.url !== '/' && location.pathname.startsWith(`${item.url}/`));

                    const itemTitle = t(`modules.names.${item.code}`, {
                      defaultValue: item.name,
                    });

                    const IconComponent = item.icon;

                    return (
                      <SidebarMenuItem key={item.code}>
                        <SidebarMenuButton asChild isActive={isItemActive}>
                          <Link to={item.url}>
                            <IconComponent className="h-4 w-4" />
                            <span>{itemTitle}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {isAdminSection ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/companies">
                  <span className="font-medium text-xs text-muted-foreground hover:text-foreground">
                    ← {t('sidebar.backToApp')}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : hasAdminAccess ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/users">
                  <span className="font-medium text-xs text-muted-foreground hover:text-foreground">
                    ⚙ {t('sidebar.admin')}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>

        <div className="flex items-center justify-between p-2 md:hidden">
          <NavUser />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

