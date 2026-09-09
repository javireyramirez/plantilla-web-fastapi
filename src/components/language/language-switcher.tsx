import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_LANGUAGES } from '@/lib/language';
import { getLanguageLabel } from '@/lib/language';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language.split('-')[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Languages />
          {getLanguageLabel(currentLang)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={currentLang}
            onValueChange={(lang) => i18n.changeLanguage(lang)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuRadioItem key={lang} value={lang}>
                {getLanguageLabel(lang)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
