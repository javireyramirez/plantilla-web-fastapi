import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import logo from '@/assets/logo.png';
import { LanguageSwitcher } from '@/components/language/language-switcher';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

export default function PublicLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex h-14 items-center justify-between px-6 border-b shrink-0">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="size-8 object-contain" />
          <span className="font-medium">Empresa Genérica</span>
        </div>
        {isMobile ? (
          // Móvil — todo en un dropdown
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <ModeToggle />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <LanguageSwitcher />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Desktop — iconos en el header
          <div className="flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitcher />
          </div>
        )}
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
