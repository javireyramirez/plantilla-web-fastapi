import { authClient } from '@/config/auth-client.js';

class AuthService {
  async signIn(data: { email: string; password: string; rememberMe: boolean }) {
    const { data: session, error } = await authClient.signIn.email(data);

    if (error) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    return session;
  }

  async signUp(data: {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    acceptedTerms: boolean;
  }) {
    const { data: user, error } = await authClient.signUp.email(data);

    if (error) {
      throw new Error(error.message || 'Error al registrarse');
    }

    return user;
  }

  async verifyEmail(data: { token: string; callbackURL?: string }) {
    try {
      const { data: user, error } = await authClient.verifyEmail({
        query: data,
      });

      if (error) {
        console.error('Error verificando email:', error);
        throw new Error(error.message || 'Error al verificar el email');
      }

      return user;
    } catch (error) {
      console.error('Error en verifyEmail:', error);
      throw error;
    }
  }

  async sendVerificationEmail(data: { email: string; callbackURL?: string }) {
    try {
      const { data: result, error } = await authClient.sendVerificationEmail(data);

      if (error) {
        console.error('Error enviando email de verificación:', error);
        throw new Error(error.message || 'Error al enviar correo de verificación');
      }

      return result;
    } catch (error) {
      console.error('Error en sendVerificationEmail:', error);
      throw error;
    }
  }

  async requestPasswordReset(data: { email: string; redirectTo?: string }) {
    const { data: user, error } = await authClient.requestPasswordReset(data);

    if (error) {
      throw new Error(error.message || 'Error al enviar correo de recuperación');
    }

    return user;
  }

  async resetPassword(data: { newPassword: string; token: string }) {
    const { data: user, error } = await authClient.resetPassword({
      newPassword: data.newPassword,
      token: data.token,
    });

    if (error) {
      throw new Error(error.message || 'Error al cambiar de contraseña');
    }

    return user;
  }

  async changePassword(data: {
    newPassword: string;
    currentPassword: string;
    revokeOtherSessions: boolean;
  }) {
    const { data: user, error } = await authClient.changePassword({
      newPassword: data.newPassword,
      currentPassword: data.currentPassword,
      revokeOtherSessions: data.revokeOtherSessions,
    });

    if (error) {
      throw new Error(error.message || 'Error al cambiar de contraseña');
    }

    return user;
  }

  async signOut() {
    const { error } = await authClient.signOut();

    if (error) {
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  }

  async outhGoogle() {
    const { data: user, error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/home`,
      errorCallbackURL: `${window.location.origin}/error`,
    });

    if (error) {
      throw new Error(error.message || 'Error al iniciar sesión con Google');
    }

    return user;
  }
}

export default new AuthService();
