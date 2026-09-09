import {
  Briefcase,
  Building2,
  Building2Icon,
  FileText,
  History as HistoryIcon,
  Home,
  HomeIcon,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { useEffect } from 'react';

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

import NavUser from './nav-user.js';
import { adminItems } from './sidebar-routes.js';

export default function LayoutSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

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
        {adminItems.map((group) => (
          <SidebarGroup key={group.groupKey}>
            <SidebarGroupLabel>{t(group.groupKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to={'/home'}>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  <span> {t('sidebar.home')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex items-center justify-between p-2 md:hidden">
            <NavUser />
          </div>
        </>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
