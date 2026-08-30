/**
 * Authentication Zod Schemas
 * 
 * Validation schemas for authentication-related requests and responses
 */

import { z } from 'zod';

/**
 * Login Request Schema
 * Validates email and password for authentication
 */
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .describe('User email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .describe('User password'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * User Session Response Schema
 * Represents authenticated user session data
 */
export const UserSessionSchema = z.object({
  user_id: z.string().uuid().describe('Unique user identifier'),
  email: z.string().email().describe('User email address'),
  full_name: z.string().describe('User full name'),
  role: z.string().describe('User role name'),
  branch_id: z.string().uuid().nullable().describe('User branch identifier'),
  is_active: z.boolean().describe('Whether user account is active'),
  permissions: z.array(z.string()).describe('Array of permission codes'),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

/**
 * JWT Token Pair Schema
 * Contains access and refresh tokens for authenticated session
 */
export const TokenPairSchema = z.object({
  access_token: z.string().describe('JWT access token'),
  refresh_token: z.string().describe('JWT refresh token'),
  expires_in: z.number().positive().int().describe('Token expiration in seconds'),
});

export type TokenPair = z.infer<typeof TokenPairSchema>;

/**
 * Login Success Response Schema
 * Successful authentication response with session and tokens
 */
export const LoginSuccessResponseSchema = z.object({
  success: z.literal(true),
  session: z.object({
    user: UserSessionSchema,
    access_token: z.string().describe('JWT access token'),
    refresh_token: z.string().describe('JWT refresh token'),
    expires_in: z.number().positive().int().describe('Token expiration in seconds'),
  }),
});

export type LoginSuccessResponse = z.infer<typeof LoginSuccessResponseSchema>;

/**
 * Login Error Response Schema
 * Error response for failed authentication
 */
export const LoginErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('Error message'),
});

export type LoginErrorResponse = z.infer<typeof LoginErrorResponseSchema>;

/**
 * Login Response Schema (Union)
 * Can be either success or error response
 */
export const LoginResponseSchema = z.union([
  LoginSuccessResponseSchema,
  LoginErrorResponseSchema,
]);

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Password Reset Request Schema
 */
export const PasswordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .describe('User email address for password reset'),
});

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

/**
 * Set Password Request Schema
 */
export const SetPasswordRequestSchema = z.object({
  invitation_token: z
    .string()
    .min(1, 'Invitation token is required')
    .describe('Password reset or invitation token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .describe('New password'),
  password_confirmation: z
    .string()
    .min(8, 'Password confirmation must be at least 8 characters')
    .describe('Password confirmation'),
});

export type SetPasswordRequest = z.infer<typeof SetPasswordRequestSchema>;

/**
 * Verify Session Request Schema
 */
export const VerifySessionRequestSchema = z.object({
  token: z
    .string()
    .optional()
    .describe('Access token or refresh token to verify'),
});

export type VerifySessionRequest = z.infer<typeof VerifySessionRequestSchema>;

/**
 * Verify Session Response Schema
 */
export const VerifySessionResponseSchema = z.object({
  success: z.literal(true),
  user: UserSessionSchema,
  access_token: z.string().optional().describe('New access token if refreshed'),
  refresh_token: z.string().optional().describe('Refresh token'),
  expires_in: z.number().positive().int().describe('Token expiration in seconds'),
  refreshed: z.boolean().describe('Whether token was refreshed'),
});

export type VerifySessionResponse = z.infer<typeof VerifySessionResponseSchema>;

/**
 * Logout Response Schema
 */
export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
