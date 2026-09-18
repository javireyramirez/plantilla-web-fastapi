import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/\d/, 'Debe incluir al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo (p.ej. !@#$%^&*)')
  .regex(/^\S+$/, 'No debe contener espacios')
  .trim();

const emailValidation = z.string().email('Email inválido').trim();

export const AuthBaseSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const SignInSchema = AuthBaseSchema.omit({
  password: true,
}).extend({
  rememberMe: z.boolean().default(false),
  password: z.string().min(1, 'Se requiere contraseña'),
});

export const SignUpSchema = AuthBaseSchema.extend({
  name: z.string().min(1, 'Se requiere nombre').trim(),
  confirmPassword: z.string().trim(),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ['confirmPassword'],
      code: 'custom',
      message: 'Las contraseñas no coinciden',
    });
  }
});

export const ForgotPasswordSchema = AuthBaseSchema.pick({ email: true });

export const ResetPasswordSchema = z
  .object({
    new_password: passwordValidation,
    confirmPassword: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Las contraseñas no coinciden',
      });
    }
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    new_password: passwordValidation,
    confirmPassword: z.string().trim(),
    revokeOtherSessions: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Las contraseñas no coinciden',
      });
    }
  });

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1, 'Se requiere nombre').trim().optional(),
    email: emailValidation.optional(),
    password: passwordValidation.optional(),
    confirmPassword: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password) {
      if (!data.confirmPassword) {
        ctx.addIssue({
          path: ['confirmPassword'],
          code: 'custom',
          message: 'Debes confirmar la contraseña',
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          path: ['confirmPassword'],
          code: 'custom',
          message: 'Las contraseñas no coinciden',
        });
      }
    }

    if (!data.name && !data.email && !data.password) {
      ctx.addIssue({
        path: ['name'],
        code: 'custom',
        message: 'Debes actualizar al menos un campo',
      });
    }
  });

export const MagicLinkRequestSchema = z.object({
  email: emailValidation,
  callback_url: z.string().optional(),
});

export const MagicLinkVerifySchema = z.object({
  token: z.string().min(1, 'Se requiere un token').trim(),
});

export const TwoFactorCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

export const TwoFactorRecoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/, 'Formato inválido. Debe ser de 8 caracteres (ej. K7X9-M2W4)'),
});

export const TwoFactorDisableSchema = z
  .object({
    code: z.string().trim().optional().nullable(),
    password: z.string().optional().nullable(),
  })
  .refine((data) => (data.code && data.code.trim().length > 0) || (data.password && data.password.trim().length > 0), {
    message: 'Debes proporcionar tu código de autenticación o tu contraseña actual',
    path: ['code'],
  });

export const ChangeEmailSchema = z.object({
  new_email: emailValidation,
  current_password: z.string().optional().nullable(),
});

export const DeleteAccountSchema = z.object({
  password: z.string().optional().nullable(),
  confirmText: z.string().refine((val) => val === 'ELIMINAR' || val === 'DELETE', {
    message: 'Escribe ELIMINAR para confirmar la eliminación de la cuenta',
  }),
});

export interface UserSessionItem {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  is_current: boolean;
  impersonated_by: string | null;
}

export type SignInValues = z.input<typeof SignInSchema>;
export type SignUpValues = z.input<typeof SignUpSchema>;
export type ForgotPasswordValues = z.input<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaValues = z.input<typeof ResetPasswordSchema>;
export type ChangePasswordSchemaValues = z.input<typeof ChangePasswordSchema>;
export type UpdateUserSchemaValues = z.input<typeof UpdateUserSchema>;
export type MagicLinkRequestValues = z.input<typeof MagicLinkRequestSchema>;
export type MagicLinkVerifyValues = z.input<typeof MagicLinkVerifySchema>;
export type TwoFactorCodeValues = z.input<typeof TwoFactorCodeSchema>;
export type TwoFactorRecoveryCodeValues = z.input<typeof TwoFactorRecoveryCodeSchema>;
export type TwoFactorDisableValues = z.input<typeof TwoFactorDisableSchema>;
export type ChangeEmailValues = z.input<typeof ChangeEmailSchema>;
export type DeleteAccountValues = z.input<typeof DeleteAccountSchema>;

