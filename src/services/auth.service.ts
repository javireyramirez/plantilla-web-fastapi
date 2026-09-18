import instance from '@/config/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  emailVerified?: boolean;
  is_active: boolean;
  isActive?: boolean;
  is_super_admin: boolean;
  isSuperAdmin?: boolean;
  is_system?: boolean;
  isSystem?: boolean;
  two_factor_enabled: boolean;
  twoFactorEnabled?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  image?: string | null;
  [key: string]: any;
}

export interface AuthSession {
  id: string;
  token?: string;
  user_id?: string;
  userId?: string;
  expires_at?: string;
  expiresAt?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  ip_address?: string | null;
  ipAddress?: string | null;
  user_agent?: string | null;
  userAgent?: string | null;
  is_valid?: boolean;
  isValid?: boolean;
  impersonated_by?: string | null;
  impersonatedBy?: string | null;
  is_impersonated?: boolean;
  isImpersonated?: boolean;
  [key: string]: any;
}

export interface AuthSessionResponse {
  user: AuthUser;
  session: AuthSession;
  [key: string]: any;
}

/**
 * Normaliza los datos del usuario provenientes del backend (snake_case por defecto)
 * asegurando compatibilidad total tanto con snake_case como con camelCase legacy.
 */
export function normalizeAuthUser(user: any): AuthUser {
  if (!user || typeof user !== 'object') return user;

  const emailVerified = Boolean(user.email_verified ?? user.emailVerified);
  user.email_verified = emailVerified;
  user.emailVerified = emailVerified;

  const isActive = Boolean(user.is_active ?? user.isActive ?? true);
  user.is_active = isActive;
  user.isActive = isActive;

  const isSuperAdmin = Boolean(user.is_super_admin ?? user.isSuperAdmin);
  user.is_super_admin = isSuperAdmin;
  user.isSuperAdmin = isSuperAdmin;

  const isSystem = Boolean(user.is_system ?? user.isSystem);
  user.is_system = isSystem;
  user.isSystem = isSystem;

  const twoFactorEnabled = Boolean(user.two_factor_enabled ?? user.twoFactorEnabled);
  user.two_factor_enabled = twoFactorEnabled;
  user.twoFactorEnabled = twoFactorEnabled;

  const createdAt = user.created_at ?? user.createdAt;
  if (createdAt) {
    user.created_at = createdAt;
    user.createdAt = createdAt;
  }

  const updatedAt = user.updated_at ?? user.updatedAt;
  if (updatedAt) {
    user.updated_at = updatedAt;
    user.updatedAt = updatedAt;
  }

  return user;
}

/**
 * Normaliza la sesión proveniente del backend (snake_case)
 */
export function normalizeAuthSession(session: any): AuthSession {
  if (!session || typeof session !== 'object') return session;

  const userId = session.user_id ?? session.userId;
  if (userId) {
    session.user_id = userId;
    session.userId = userId;
  }

  const expiresAt = session.expires_at ?? session.expiresAt;
  if (expiresAt) {
    session.expires_at = expiresAt;
    session.expiresAt = expiresAt;
  }

  const createdAt = session.created_at ?? session.createdAt;
  if (createdAt) {
    session.created_at = createdAt;
    session.createdAt = createdAt;
  }

  const updatedAt = session.updated_at ?? session.updatedAt;
  if (updatedAt) {
    session.updated_at = updatedAt;
    session.updatedAt = updatedAt;
  }

  const ipAddress = session.ip_address ?? session.ipAddress;
  if (ipAddress) {
    session.ip_address = ipAddress;
    session.ipAddress = ipAddress;
  }

  const userAgent = session.user_agent ?? session.userAgent;
  if (userAgent) {
    session.user_agent = userAgent;
    session.userAgent = userAgent;
  }

  const isValid = session.is_valid ?? session.isValid ?? true;
  session.is_valid = isValid;
  session.isValid = isValid;

  const impersonatedBy = session.impersonated_by ?? session.impersonatedBy ?? null;
  session.impersonated_by = impersonatedBy;
  session.impersonatedBy = impersonatedBy;
  session.is_impersonated = Boolean(impersonatedBy);
  session.isImpersonated = Boolean(impersonatedBy);

  return session;
}

class AuthService {
  async getSession(): Promise<AuthSessionResponse | null> {
    try {
      const response = await instance.get<AuthSessionResponse>('/auth/get-session');
      if (response.data) {
        if (response.data.user) normalizeAuthUser(response.data.user);
        if (response.data.session) normalizeAuthSession(response.data.session);
      }
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.status === 401) {
        return null;
      }
      throw error;
    }
  }

  async signIn(data: { email: string; password: string; rememberMe?: boolean }) {
    try {
      const response = await instance.post<any>('/auth/sign-in/email', {
        email: data.email.trim(),
        password: data.password,
        remember_me: data.rememberMe ?? false,
      });
      if (response.data) {
        if (response.data.user) normalizeAuthUser(response.data.user);
        if (response.data.session) normalizeAuthSession(response.data.session);
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al iniciar sesión';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async signUp(data: {
    email: string;
    name: string;
    password: string;
    confirmPassword?: string;
    acceptedTerms?: boolean;
  }) {
    try {
      const response = await instance.post<any>('/auth/sign-up/email', {
        email: data.email.trim(),
        name: data.name.trim(),
        password: data.password,
      });
      if (response.data) {
        if (response.data.user) normalizeAuthUser(response.data.user);
        if (response.data.session) normalizeAuthSession(response.data.session);
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al registrarse';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async verifyEmail(data: { token: string; callbackURL?: string }) {
    try {
      const response = await instance.post<boolean>('/auth/verify-email', {
        token: data.token,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al verificar el email';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async sendVerificationEmail(data: { email: string; callbackURL?: string }) {
    try {
      const response = await instance.post<boolean>('/auth/send-verification-email', {
        email: data.email.trim(),
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || 'Error al enviar correo de verificación';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async requestPasswordReset(data: { email: string; redirectTo?: string }) {
    try {
      const response = await instance.post<boolean>('/auth/forget-password', {
        email: data.email.trim(),
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || 'Error al enviar correo de recuperación';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async resetPassword(data: {
    newPassword?: string;
    new_password?: string;
    token: string;
  }) {
    try {
      const new_password = data.new_password ?? data.newPassword;
      const response = await instance.post<boolean>('/auth/reset-password', {
        token: data.token,
        new_password,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al cambiar de contraseña';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async changePassword(data: {
    newPassword?: string;
    new_password?: string;
    currentPassword?: string;
    current_password?: string;
    revokeOtherSessions?: boolean;
    revoke_other_sessions?: boolean;
  }) {
    try {
      const new_password = data.new_password ?? data.newPassword;
      const current_password = data.current_password ?? data.currentPassword;
      const revoke_other_sessions =
        data.revoke_other_sessions ?? data.revokeOtherSessions ?? false;

      const response = await instance.post<boolean>('/auth/change-password', {
        current_password,
        new_password,
        revoke_other_sessions,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al cambiar de contraseña';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async signOut(): Promise<boolean> {
    try {
      const response = await instance.post<boolean>('/auth/sign-out');
      return response.data;
    } catch (error) {
      // Si falla la red o ya expiró, consideramos la sesión cerrada
      return true;
    }
  }

  async outhGoogle() {
    const backURL = import.meta.env.VITE_BACK_URL || '';
    window.location.href = `${backURL}/api/auth/sign-in/social/google`;
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
      if (response.data) {
        if (response.data.user) normalizeAuthUser(response.data.user);
        if (response.data.session) normalizeAuthSession(response.data.session);
      }
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
      const response = await instance.get<any>('/auth/get-session');
      const d = response.data;
      if (d) {
        if (d.user) normalizeAuthUser(d.user);
        if (d.session) normalizeAuthSession(d.session);
      }
      return {
        ...d,
        ...(d?.user || {}),
      };
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
    qr_code?: string;
    otpauth_url?: string;
  }> {
    try {
      const response = await instance.post<any>('/auth/two-factor/setup');
      const d = response.data;
      return {
        ...d,
        qr_code_data_uri: d.qr_code_data_uri || d.qr_code || '',
        uri: d.uri || d.otpauth_url || '',
      };
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
      if (response.data) {
        if (response.data.user) normalizeAuthUser(response.data.user);
        if (response.data.session) normalizeAuthSession(response.data.session);
      }
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

  async changeEmail(data: { new_email: string; current_password?: string | null }): Promise<boolean> {
    try {
      const response = await instance.post<boolean>('/auth/change-email', {
        new_email: data.new_email.trim(),
        current_password: data.current_password || null,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al cambiar el correo electrónico';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async deleteUser(data: { password?: string | null }): Promise<boolean> {
    try {
      const response = await instance.post<boolean>('/auth/delete-user', {
        password: data.password || null,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al eliminar la cuenta';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async listMySessions(): Promise<any[]> {
    try {
      const response = await instance.get<any[]>('/auth/list-sessions');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al obtener las sesiones activas';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async revokeMySession(sessionId: string): Promise<boolean> {
    try {
      const response = await instance.post<boolean>('/auth/revoke-session', {
        session_id: sessionId,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al revocar la sesión';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async revokeAllMySessions(): Promise<boolean> {
    try {
      const response = await instance.post<boolean>('/auth/revoke-sessions');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al revocar todas las sesiones';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async impersonateUser(userId: string): Promise<any> {
    try {
      const response = await instance.post<any>(`/auth/impersonate/${userId}`);
      if (response.data) {
        if (response.data.user) normalizeAuthUser(response.data.user);
        if (response.data.session) normalizeAuthSession(response.data.session);
      }
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al iniciar la suplantación';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }

  async exitImpersonation(): Promise<any> {
    try {
      const response = await instance.post<any>('/auth/impersonate/exit');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Error al finalizar la suplantación';
      const customError: any = new Error(message);
      customError.status = error.response?.status;
      customError.response = error.response;
      throw customError;
    }
  }
}

export default new AuthService();

