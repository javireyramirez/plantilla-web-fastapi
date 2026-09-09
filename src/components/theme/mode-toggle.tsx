import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/components/theme/theme-provider.js';
import { Label } from '@/components/ui/label.js';
import { Switch } from '@/components/ui/switch.js';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <Switch
        id="dark-mode"
        checked={theme === 'dark'}
        onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
      <Label htmlFor="dark-mode">{t('theme.mode')}</Label>
    </div>
  );
}
