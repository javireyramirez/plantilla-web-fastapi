import { useNavigate } from 'react-router-dom';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markSigningOut } from '@/lib/auth-flags.js';
import authService from '@/services/auth.service.js';

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authService.signIn(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      console.log('Sesión iniciada');
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

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      console.log('Cuenta creada');
    },

    onError: (error) => {
      console.error('Sign-Up error:', error);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { token: string; callbackURL?: string }) => authService.verifyEmail(data),

    onSuccess: (user) => {
      console.log('Email verificado', user);
    },

    onError: (error) => {
      console.error('Error env erifyEmail:', error);
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
    mutationFn: () => authService.signOut(),

    onSuccess: () => {
      markSigningOut();
      queryClient.clear();
      navigate('/signin', { replace: true });
      console.log('Sesión cerrada');
    },

    onError: (error) => {
      console.error('Sign-Out error:', error);
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
