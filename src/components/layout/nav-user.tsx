import { ChevronsUpDown, LoaderCircle, LogOut, User } from 'lucide-react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/language/language-switcher';
import { ModeToggle } from '@/components/theme/mode-toggle.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.js';
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.js';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar.js';
import { useSession } from '@/config/auth-client.js';
import { useSignOut } from '@/hooks/use-auth.js';
import { SUPPORTED_LANGUAGES } from '@/lib/language';
import { getLanguageLabel } from '@/lib/language';

export default function NavUser() {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.language.split('-')[0];

  const { isMobile } = useSidebar();
  const { mutate: signOut, isPending } = useSignOut();
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-label="Cargando" />
          <p className="text-sm text-muted-foreground">{t('nav.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  const getUserInitials = () => {
    if (session?.user.name) {
      const names = session.user.name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : session.user.name.substring(0, 2).toUpperCase();
    }
    return session?.user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const userInitials = getUserInitials();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={session?.user.image ?? undefined}
                  alt={session?.user.name ?? 'Usuario'}
                />
                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{session?.user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {session?.user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={session?.user.image ?? undefined}
                    alt={session?.user.name ?? 'Usuario'}
                  />
                  <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {session?.user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <ModeToggle />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Languages className="mr-2 h-4 w-4" />
                {getLanguageLabel(currentLang)}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => i18n.changeLanguage(lang)}
                    className="flex justify-between"
                  >
                    {getLanguageLabel(lang)}
                    {currentLang === lang && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {t('nav.closingSession')}
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.closeSession')}
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
