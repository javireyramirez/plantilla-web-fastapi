import { useNavigate } from 'react-router-dom';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/config/auth-client.js';
import { clearSigningOut, markSigningOut } from '@/lib/auth-flags.js';
import authService from '@/services/auth.service.js';

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authService.signIn(data),

    onSuccess: async (data: any) => {
      if (!data?.two_factor_required) {
        clearSigningOut();
        if (data?.session && data?.user) {
          queryClient.setQueryData(['session'], data);
        }
        await queryClient.invalidateQueries({ queryKey: ['session'] });
        await queryClient.invalidateQueries({ queryKey: ['current-user'] });
        console.log('Sesión iniciada');
      }
    },

    onError: (error) => {
      console.error('Login error:', error);
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authService.signUp(data),

    onSuccess: async (data: any) => {
      clearSigningOut();
      if (data?.session && data?.user) {
        queryClient.setQueryData(['session'], data);
      }
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      console.log('Cuenta creada');
    },

    onError: (error) => {
      console.error('Sign-Up error:', error);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { token: string; callbackURL?: string }) => authService.verifyEmail(data),

    onSuccess: async (user) => {
      console.log('Email verificado', user);
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },

    onError: (error) => {
      console.error('Error en verifyEmail:', error);
    },
  });
}

export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: (data: { email: string; callbackURL?: string }) =>
      authService.sendVerificationEmail(data),

    onSuccess: () => {
      console.log('Email de verificación enviado');
    },

    onError: (error) => {
      console.error('Error env sendVerificationEmail:', error);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: any) => authService.requestPasswordReset(data),

    onSuccess: () => {
      console.log('Email de recuperación enviado');
    },

    onError: (error) => {
      console.error('Error en el envío del email:', error);
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authService.resetPassword(data),

    onSuccess: () => {
      queryClient.clear();
      console.log('Contraseña cambiada correctamente');
    },

    onError: (error) => {
      console.error('Error en resetPassword:', error);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authService.changePassword(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      console.log('Contraseña cambiada correctamente');
    },

    onError: (error) => {
      console.error('Error en changePassword:', error);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      markSigningOut();
      try {
        localStorage.removeItem('is_impersonated');
      } catch {}
      await authService.signOut();
    },
    onMutate: () => {
      markSigningOut();
      queryClient.setQueryData(['session'], null);
    },
    onSettled: () => {
      queryClient.clear();
      navigate('/signin', { replace: true });
    },
  });
}

export function useOuthGoogle() {
  return useMutation({
    mutationFn: () => authService.outhGoogle(),

    onSuccess: () => {
      console.log('Outh Google');
    },

    onError: (error) => {
      console.error('Error en Outh Google:', error);
    },
  });
}

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (data: { email: string; callback_url?: string }) =>
      authService.requestMagicLink(data),

    onSuccess: () => {
      console.log('Enlace mágico solicitado');
    },

    onError: (error) => {
      console.error('Error al solicitar enlace mágico:', error);
    },
  });
}

export function useVerifyMagicLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { token: string }) => authService.verifyMagicLink(data),

    onSuccess: async (data: any) => {
      if (!data?.two_factor_required) {
        await queryClient.invalidateQueries({ queryKey: ['session'] });
        await queryClient.invalidateQueries({ queryKey: ['current-user'] });
        console.log('Enlace mágico verificado y sesión iniciada');
      }
    },

    onError: (error) => {
      console.error('Error al verificar enlace mágico:', error);
    },
  });
}

export function useCurrentUser() {
  const { data: session } = useSession();
  const sessionUser = session?.user
    ? {
        ...session.user,
        ...session,
        user: session.user,
        session: (session as any).session,
      }
    : undefined;

  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => authService.getMe(),
    initialData: sessionUser,
    enabled: !!session?.user,
    staleTime: 60 * 1000,
  });
}

export function useTwoFactorSetup() {
  return useMutation({
    mutationFn: () => authService.setupTwoFactor(),
  });
}

export function useTwoFactorEnable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => authService.enableTwoFactor(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

export function useTwoFactorDisable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code?: string | null; password?: string | null }) =>
      authService.disableTwoFactor(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

export function useTwoFactorRecoveryCodes() {
  return useMutation({
    mutationFn: (data: { code: string }) => authService.regenerateRecoveryCodes(data),
  });
}

export function useTwoFactorSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { two_factor_token: string; code: string }) =>
      authService.signInTwoFactor(data),
    onSuccess: async () => {
      clearSigningOut();
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

export function useChangeEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { new_email: string; current_password?: string | null }) =>
      authService.changeEmail(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { password?: string | null }) => authService.deleteUser(data),
    onSuccess: () => {
      markSigningOut();
      queryClient.clear();
      navigate('/signin', { replace: true });
    },
  });
}

export function useMySessions() {
  return useQuery({
    queryKey: ['my-sessions'],
    queryFn: () => authService.listMySessions(),
    staleTime: 10 * 1000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authService.revokeMySession(sessionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => authService.revokeAllMySessions(),
    onSuccess: () => {
      markSigningOut();
      queryClient.clear();
      navigate('/signin', { replace: true });
    },
  });
}

export function useImpersonateUser() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (userId: string) => authService.impersonateUser(userId),
    onSuccess: async () => {
      try {
        localStorage.setItem('is_impersonated', 'true');
      } catch {
        // ignore
      }
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      navigate('/home', { replace: true });
    },
  });
}

export function useExitImpersonation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => authService.exitImpersonation(),
    onSuccess: async () => {
      try {
        localStorage.removeItem('is_impersonated');
      } catch {
        // ignore
      }
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      navigate('/admin/users', { replace: true });
    },
  });
}

