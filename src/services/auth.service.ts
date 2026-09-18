import instance from '@/config/api';
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

  async resetPassword(data: {
    newPassword?: string;
    new_password?: string;
    token: string;
  }) {
    const new_password = data.new_password ?? data.newPassword;
    const { data: user, error } = await authClient.resetPassword({
      newPassword: new_password as string,
      new_password: new_password,
      token: data.token,
    } as any);

    if (error) {
      throw new Error(error.message || 'Error al cambiar de contraseña');
    }

    return user;
  }

  async changePassword(data: {
    newPassword?: string;
    new_password?: string;
    currentPassword?: string;
    current_password?: string;
    revokeOtherSessions?: boolean;
    revoke_other_sessions?: boolean;
  }) {
    const new_password = data.new_password ?? data.newPassword;
    const current_password = data.current_password ?? data.currentPassword;
    const revoke_other_sessions = data.revoke_other_sessions ?? data.revokeOtherSessions;

    const { data: user, error } = await authClient.changePassword({
      newPassword: new_password as string,
      new_password: new_password,
      currentPassword: current_password as string,
      current_password: current_password,
      revokeOtherSessions: revoke_other_sessions as boolean,
      revoke_other_sessions: revoke_other_sessions,
    } as any);

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

  async requestMagicLink(data: { email: string; callback_url?: string }): Promise<boolean> {
    try {
      const payload: { email: string; callback_url?: string } = {
        email: data.email,
      };
      if (data.callback_url) {
        payload.callback_url = data.callback_url;
      }
      const response = await instance.post<boolean>('/auth/sign-in/magic-link', payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al solicitar el enlace mágico';
      throw new Error(message);
    }
  }

  async verifyMagicLink(data: { token: string }): Promise<{ user: any; session: any }> {
    try {
      const response = await instance.post<{ user: any; session: any }>('/auth/verify-magic-link', {
        token: data.token,
      });
      return response.data;
    } catch (error: any) {
      const customError: any = new Error(
        error.response?.data?.detail || error.message || 'Error al verificar el enlace mágico'
      );
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async getMe(): Promise<any> {
    try {
      const response = await instance.get<any>('/auth/me');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al obtener usuario';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async setupTwoFactor(): Promise<{
    secret: string;
    uri: string;
    qr_code_data_uri: string;
  }> {
    try {
      const response = await instance.post<{
        secret: string;
        uri: string;
        qr_code_data_uri: string;
      }>('/auth/two-factor/setup');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al configurar el doble factor';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async enableTwoFactor(data: { code: string }): Promise<{
    two_factor_enabled: boolean;
    backup_codes: string[];
  }> {
    try {
      const response = await instance.post<{
        two_factor_enabled: boolean;
        backup_codes: string[];
      }>('/auth/two-factor/enable', {
        code: data.code.trim(),
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || 'Código incorrecto. Vuelve a intentarlo';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async disableTwoFactor(data: {
    code?: string | null;
    password?: string | null;
  }): Promise<{ message: string }> {
    try {
      const payload: { code?: string | null; password?: string | null } = {};
      if (data.code && data.code.trim().length > 0) {
        payload.code = data.code.trim();
        payload.password = null;
      } else if (data.password && data.password.length > 0) {
        payload.code = null;
        payload.password = data.password;
      }
      const response = await instance.post<{ message: string }>('/auth/two-factor/disable', payload);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || 'Código 2FA o contraseña incorrectos';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async regenerateRecoveryCodes(data: { code: string }): Promise<{
    backup_codes: string[];
  }> {
    try {
      const response = await instance.post<{
        backup_codes: string[];
      }>('/auth/two-factor/recovery-codes', {
        code: data.code.trim(),
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || 'Código 2FA incorrecto';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async signInTwoFactor(data: {
    two_factor_token: string;
    code: string;
  }): Promise<{
    user: any;
    session: any;
    two_factor_required: boolean;
    two_factor_token: string | null;
  }> {
    try {
      const response = await instance.post<{
        user: any;
        session: any;
        two_factor_required: boolean;
        two_factor_token: string | null;
      }>('/auth/sign-in/two-factor', {
        two_factor_token: data.two_factor_token,
        code: data.code.trim(),
      });
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      let message = error.response?.data?.detail || error.message;

      if (status === 400 && (!message || message.includes('expirado') || message.includes('inválido'))) {
        message = 'El token de desafío es inválido o ha expirado';
      } else if (status === 401 && !message) {
        message = 'Código de autenticación o código de recuperación inválido';
      } else if (status === 429 && !message) {
        message = 'Demasiadas peticiones. Por favor, espera antes de volver a intentarlo';
      }

      const customError: any = new Error(message || 'Error al verificar doble factor');
      customError.status = status;
      customError.response = error.response;
      throw customError;
    }
  }
}

export default new AuthService();

