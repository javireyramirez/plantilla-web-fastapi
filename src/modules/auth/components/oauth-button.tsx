import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import appleLogo from '@/assets/apple.svg';
import googleLogo from '@/assets/google.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.js';
import { Button } from '@/components/ui/button.js';
import { useOuthGoogle } from '@/hooks/use-auth.js';

interface OauthButtonProps {
  isSubmitting: boolean;
}

export default function OauthButton({ isSubmitting }: OauthButtonProps) {
  const { t } = useTranslation();

  const { mutate: outhGoogleMutation, isPending: isPendingGoogle } = useOuthGoogle();

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">
            {t('auth.orContinueWith')}
          </span>
        </div>
      </div>

      <div className="flex flex-row gap-6 justify-center items-center mt-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="rounded-full size-12 hover:bg-muted transition-all duration-200"
          onClick={() => outhGoogleMutation()}
          disabled={isSubmitting || isPendingGoogle}
          aria-label={t('auth.signInWithGoogle')}
        >
          {isPendingGoogle ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            <Avatar className="size-10 border shadow-sm">
              <AvatarImage src={googleLogo} className="p-2" alt="Google" />
              <AvatarFallback>G</AvatarFallback>
            </Avatar>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="rounded-full size-12 hover:bg-muted transition-all duration-200"
          onClick={() => toast.info('Apple')}
          disabled={isSubmitting}
          aria-label={t('auth.signInWithApple')}
        >
          <Avatar className="size-10 border shadow-sm">
            <AvatarImage src={appleLogo} className="p-2" alt="Apple" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </div>
  );
}
