// lib/validations/password.ts - Password validation schemas for authentication

import { z } from 'zod';

/**
 * Password complexity validation
 * Requirements: 12.5 - Password security standards
 * 
 * Rules:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*)
 * - Cannot contain user's email or username (checked at API level)
 */

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_SPECIAL_CHARS = /[!@#$%^&*]/;
const PASSWORD_UPPERCASE = /[A-Z]/;
const PASSWORD_LOWERCASE = /[a-z]/;
const PASSWORD_DIGITS = /[0-9]/;

export const passwordValidationSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine(
    (password) => PASSWORD_UPPERCASE.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => PASSWORD_LOWERCASE.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => PASSWORD_DIGITS.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => PASSWORD_SPECIAL_CHARS.test(password),
    'Password must contain at least one special character (!@#$%^&*)'
  );

/**
 * Validate password and return specific error messages for failed requirements
 * This allows us to return detailed validation feedback to the client
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!PASSWORD_UPPERCASE.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  if (!PASSWORD_LOWERCASE.test(password)) {
    errors.push('Must contain lowercase letter');
  }
  if (!PASSWORD_DIGITS.test(password)) {
    errors.push('Must contain number');
  }
  if (!PASSWORD_SPECIAL_CHARS.test(password)) {
    errors.push('Must contain special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Set password endpoint schema
 * Used when user sets password from invitation link or password reset
 */
export const setPasswordSchema = z
  .object({
    invitation_token: z.string().min(1, 'Invitation token is required'),
    password: passwordValidationSchema,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/**
 * Change password endpoint schema
 * Used when authenticated user changes their own password
 */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordValidationSchema,
    new_password_confirmation: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Passwords do not match',
    path: ['new_password_confirmation'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Validate that password does not contain email or username
 * This should be called at the API level to provide contextual validation
 */
export function validatePasswordNotContainsEmail(password: string, email: string): boolean {
  // Extract username from email (part before @)
  const username = email.split('@')[0];
  return !password.toLowerCase().includes(username.toLowerCase()) &&
         !password.toLowerCase().includes(email.toLowerCase());
}
