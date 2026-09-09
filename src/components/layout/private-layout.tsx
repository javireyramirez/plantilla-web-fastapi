import { Bell } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import logo from '@/assets/logo.png';
import { Separator } from '@/components/ui/separator.js';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar.js';

import NavUser from './nav-user.js';
import AppSidebar from './sidebar-common.js';

export default function PrivateLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center px-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="size-8 object-contain" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Bell />
            <div className="hidden md:block">
              <NavUser />
            </div>
          </div>
        </header>

        <main className="p-6">
          {' '}
          <Outlet />{' '}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
