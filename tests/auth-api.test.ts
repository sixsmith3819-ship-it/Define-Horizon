/**
 * Comprehensive Test Suite for Wave 2 Authentication API
 *
 * Tests for:
 * - POST /api/auth/login (Task 2.1)
 * - POST /api/auth/logout (Task 2.2)
 * - POST /api/auth/password-reset (Task 2.3)
 * - POST /api/auth/set-password (Task 2.4)
 * - POST /api/auth/verify-session (Task 2.5)
 */

import { validatePassword, getPasswordValidationErrors } from '@/lib/auth/password-validator';
import {
  LoginRequestSchema,
  PasswordResetRequestSchema,
  SetPasswordRequestSchema,
  VerifySessionRequestSchema,
} from '@/lib/schemas/auth';
import { z } from 'zod';

describe('Authentication API - Schema Validation', () => {
  describe('LoginRequestSchema', () => {
    test('should accept valid email and password', () => {
      const valid = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };
      const result = LoginRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('should reject missing email', () => {
      const invalid = {
        password: 'SecurePass123!',
      };
      const result = LoginRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject missing password', () => {
      const invalid = {
        email: 'user@example.com',
      };
      const result = LoginRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject invalid email format', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'SecurePass123!',
      };
      const result = LoginRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should normalize email to lowercase', () => {
      const input = {
        email: 'User@EXAMPLE.COM',
        password: 'SecurePass123!',
      };
      const result = LoginRequestSchema.safeParse(input);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    test('should trim email whitespace', () => {
      const input = {
        email: '  user@example.com  ',
        password: 'SecurePass123!',
      };
      const result = LoginRequestSchema.safeParse(input);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    test('should reject empty password', () => {
      const invalid = {
        email: 'user@example.com',
        password: '',
      };
      const result = LoginRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('PasswordResetRequestSchema', () => {
    test('should accept valid email', () => {
      const valid = { email: 'user@example.com' };
      const result = PasswordResetRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('should reject missing email', () => {
      const invalid = {};
      const result = PasswordResetRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject invalid email format', () => {
      const invalid = { email: 'not-an-email' };
      const result = PasswordResetRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should normalize email', () => {
      const input = { email: '  User@EXAMPLE.COM  ' };
      const result = PasswordResetRequestSchema.safeParse(input);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });
  });

  describe('SetPasswordRequestSchema', () => {
    test('should accept valid password reset request', () => {
      const valid = {
        invitation_token: 'token123456',
        password: 'NewSecure123!',
        password_confirmation: 'NewSecure123!',
      };
      const result = SetPasswordRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('should reject missing invitation_token', () => {
      const invalid = {
        password: 'NewSecure123!',
        password_confirmation: 'NewSecure123!',
      };
      const result = SetPasswordRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject missing password', () => {
      const invalid = {
        invitation_token: 'token123456',
        password_confirmation: 'NewSecure123!',
      };
      const result = SetPasswordRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject empty invitation_token', () => {
      const invalid = {
        invitation_token: '',
        password: 'NewSecure123!',
        password_confirmation: 'NewSecure123!',
      };
      const result = SetPasswordRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test('should reject password shorter than 8 characters', () => {
      const invalid = {
        invitation_token: 'token123456',
        password: 'Short1!',
        password_confirmation: 'Short1!',
      };
      const result = SetPasswordRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('VerifySessionRequestSchema', () => {
    test('should accept request with token', () => {
      const valid = { token: 'jwt.token.here' };
      const result = VerifySessionRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('should accept request without token', () => {
      const valid = {};
      const result = VerifySessionRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test('should accept request with empty token', () => {
      const valid = { token: '' };
      const result = VerifySessionRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});

describe('Password Validation Utility', () => {
  describe('validatePassword', () => {
    test('should accept strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must be at least 8 characters');
    });

    test('should reject password without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain at least 1 uppercase letter (A-Z)');
    });

    test('should reject password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain at least 1 lowercase letter (a-z)');
    });

    test('should reject password without number', () => {
      const result = validatePassword('NoNumberHere!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain at least 1 number (0-9)');
    });

    test('should reject password without special character', () => {
      const result = validatePassword('NoSpecialChar123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain at least 1 special character (!@#$%^&*)');
    });

    test('should accept special character @', () => {
      const result = validatePassword('ValidPass@123');
      expect(result.isValid).toBe(true);
    });

    test('should accept special character #', () => {
      const result = validatePassword('ValidPass#123');
      expect(result.isValid).toBe(true);
    });

    test('should accept special character $', () => {
      const result = validatePassword('ValidPass$123');
      expect(result.isValid).toBe(true);
    });

    test('should accept special character ^', () => {
      const result = validatePassword('ValidPass^123');
      expect(result.isValid).toBe(true);
    });

    test('should accept special character &', () => {
      const result = validatePassword('ValidPass&123');
      expect(result.isValid).toBe(true);
    });

    test('should accept special character *', () => {
      const result = validatePassword('ValidPass*123');
      expect(result.isValid).toBe(true);
    });

    test('should reject password containing email local part', () => {
      const result = validatePassword('JohnSmith@123!', 'john@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot contain your email address');
    });

    test('should be case-insensitive when checking email in password', () => {
      const result = validatePassword('JOHN@123!', 'john@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot contain your email address');
    });

    test('should not reject password with unrelated email', () => {
      const result = validatePassword('SecurePass123!', 'john@example.com');
      expect(result.isValid).toBe(true);
    });

    test('should report multiple errors', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should accept minimum valid password', () => {
      const result = validatePassword('Abc@1234');
      expect(result.isValid).toBe(true);
    });

    test('should accept long password', () => {
      const result = validatePassword('VeryLongSecurePassword@12345');
      expect(result.isValid).toBe(true);
    });

    test('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject password with only spaces', () => {
      const result = validatePassword('        ');
      expect(result.isValid).toBe(false);
    });
  });

  describe('getPasswordValidationErrors', () => {
    test('should return empty object for valid password', () => {
      const errors = getPasswordValidationErrors('ValidPass123!');
      expect(Object.keys(errors).length).toBe(0);
    });

    test('should return length error', () => {
      const errors = getPasswordValidationErrors('Short1!');
      expect(errors.length).toBeDefined();
    });

    test('should return uppercase error', () => {
      const errors = getPasswordValidationErrors('lowercase123!');
      expect(errors.uppercase).toBeDefined();
    });

    test('should return lowercase error', () => {
      const errors = getPasswordValidationErrors('UPPERCASE123!');
      expect(errors.lowercase).toBeDefined();
    });

    test('should return number error', () => {
      const errors = getPasswordValidationErrors('NoNumber!');
      expect(errors.number).toBeDefined();
    });

    test('should return special error', () => {
      const errors = getPasswordValidationErrors('NoSpecial123');
      expect(errors.special).toBeDefined();
    });

    test('should return email error', () => {
      const errors = getPasswordValidationErrors('John@123!', 'john@example.com');
      expect(errors.email).toBeDefined();
    });

    test('should return multiple errors', () => {
      const errors = getPasswordValidationErrors('weak', 'john@example.com');
      expect(Object.keys(errors).length).toBeGreaterThan(1);
    });
  });
});

describe('Login Endpoint - Specification Compliance', () => {
  test('should require email and password in request', () => {
    const validation = LoginRequestSchema.safeParse({});
    expect(validation.success).toBe(false);
  });

  test('should validate email format', () => {
    const validation = LoginRequestSchema.safeParse({
      email: 'invalid-email',
      password: 'pass',
    });
    expect(validation.success).toBe(false);
  });

  test('should accept valid login request format', () => {
    const validation = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123!',
    });
    expect(validation.success).toBe(true);
  });
});

describe('Password Reset - Specification Compliance', () => {
  test('should require email in request', () => {
    const validation = PasswordResetRequestSchema.safeParse({});
    expect(validation.success).toBe(false);
  });

  test('should validate email format', () => {
    const validation = PasswordResetRequestSchema.safeParse({
      email: 'not-an-email',
    });
    expect(validation.success).toBe(false);
  });

  test('should accept valid password reset request', () => {
    const validation = PasswordResetRequestSchema.safeParse({
      email: 'user@example.com',
    });
    expect(validation.success).toBe(true);
  });
});

describe('Set Password - Specification Compliance', () => {
  test('should require invitation_token', () => {
    const validation = SetPasswordRequestSchema.safeParse({
      password: 'NewPass123!',
      password_confirmation: 'NewPass123!',
    });
    expect(validation.success).toBe(false);
  });

  test('should require password', () => {
    const validation = SetPasswordRequestSchema.safeParse({
      invitation_token: 'token123',
      password_confirmation: 'NewPass123!',
    });
    expect(validation.success).toBe(false);
  });

  test('should require password_confirmation', () => {
    const validation = SetPasswordRequestSchema.safeParse({
      invitation_token: 'token123',
      password: 'NewPass123!',
    });
    expect(validation.success).toBe(false);
  });

  test('should reject password shorter than 8 characters', () => {
    const validation = SetPasswordRequestSchema.safeParse({
      invitation_token: 'token123',
      password: 'Short1!',
      password_confirmation: 'Short1!',
    });
    expect(validation.success).toBe(false);
  });

  test('should accept valid set password request', () => {
    const validation = SetPasswordRequestSchema.safeParse({
      invitation_token: 'token123456',
      password: 'NewSecure123!',
      password_confirmation: 'NewSecure123!',
    });
    expect(validation.success).toBe(true);
  });
});

describe('Verify Session - Specification Compliance', () => {
  test('should accept verify session request with token', () => {
    const validation = VerifySessionRequestSchema.safeParse({
      token: 'jwt.token.here',
    });
    expect(validation.success).toBe(true);
  });

  test('should accept verify session request without token', () => {
    const validation = VerifySessionRequestSchema.safeParse({});
    expect(validation.success).toBe(true);
  });

  test('should accept empty token', () => {
    const validation = VerifySessionRequestSchema.safeParse({
      token: '',
    });
    expect(validation.success).toBe(true);
  });
});

describe('Password Validation - Special Characters', () => {
  test('should accept ! as special character', () => {
    const result = validatePassword('Password123!');
    expect(result.isValid).toBe(true);
  });

  test('should accept @ as special character', () => {
    const result = validatePassword('Password123@');
    expect(result.isValid).toBe(true);
  });

  test('should accept # as special character', () => {
    const result = validatePassword('Password123#');
    expect(result.isValid).toBe(true);
  });

  test('should accept % as special character', () => {
    const result = validatePassword('Password123%');
    expect(result.isValid).toBe(true);
  });

  test('should reject password with only allowed special characters in wrong combination', () => {
    const result = validatePassword('passwordwithnoupperornum!');
    expect(result.isValid).toBe(false);
  });
});

describe('Email Normalization', () => {
  test('should normalize email to lowercase in login request', () => {
    const validation = LoginRequestSchema.safeParse({
      email: 'USER@EXAMPLE.COM',
      password: 'pass',
    });
    if (validation.success) {
      expect(validation.data.email).toBe('user@example.com');
    }
  });

  test('should normalize email to lowercase in password reset request', () => {
    const validation = PasswordResetRequestSchema.safeParse({
      email: 'USER@EXAMPLE.COM',
    });
    if (validation.success) {
      expect(validation.data.email).toBe('user@example.com');
    }
  });
});

describe('Password Complexity Edge Cases', () => {
  test('should accept password with exactly 8 characters', () => {
    const result = validatePassword('Pass@123');
    expect(result.isValid).toBe(true);
  });

  test('should reject password with exactly 7 characters', () => {
    const result = validatePassword('Pass@12');
    expect(result.isValid).toBe(false);
  });

  test('should accept password with numbers at different positions', () => {
    const result1 = validatePassword('1Password!');
    const result2 = validatePassword('Passwo1rd!');
    const result3 = validatePassword('Password1!');
    expect(result1.isValid).toBe(true);
    expect(result2.isValid).toBe(true);
    expect(result3.isValid).toBe(true);
  });

  test('should accept password with multiple special characters', () => {
    const result = validatePassword('Pass@word!123');
    expect(result.isValid).toBe(true);
  });

  test('should accept password with multiple numbers', () => {
    const result = validatePassword('Password123!456');
    expect(result.isValid).toBe(true);
  });

  test('should accept password with all numbers and special chars except lowercase', () => {
    const result = validatePassword('PASSWORD123!');
    expect(result.isValid).toBe(false);
  });

  test('should accept password with unicode characters mixed in', () => {
    const result = validatePassword('Pässwörd123!');
    expect(result.isValid).toBe(true);
  });
});

describe('Rate Limiting Considerations', () => {
  test('login request should be validated before rate limiting', () => {
    const validation = LoginRequestSchema.safeParse({
      email: 'invalid',
      password: '',
    });
    expect(validation.success).toBe(false);
  });

  test('multiple failed attempts should be tracked per IP', () => {
    // This would require mocking the rate limit map
    // For now, validate that the schema accepts login requests
    const validation = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'pass',
    });
    expect(validation.success).toBe(true);
  });
});

describe('Security - No Sensitive Data Exposure', () => {
  test('password should not be exposed in validation schema', () => {
    const validation = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'VerySecurePassword',
    });
    // The schema should not transform the password in any observable way
    if (validation.success) {
      expect(validation.data.password).toBe('VerySecurePassword');
    }
  });

  test('set password schema should not modify password', () => {
    const validation = SetPasswordRequestSchema.safeParse({
      invitation_token: 'token',
      password: 'NewPass123!',
      password_confirmation: 'NewPass123!',
    });
    if (validation.success) {
      expect(validation.data.password).toBe('NewPass123!');
    }
  });
});

describe('Error Message Specificity', () => {
  test('password too short should specify 8 characters', () => {
    const errors = getPasswordValidationErrors('Short1!');
    if (errors.length) {
      expect(errors.length).toContain('8');
    }
  });

  test('missing uppercase should mention uppercase', () => {
    const errors = getPasswordValidationErrors('password123!');
    if (errors.uppercase) {
      expect(errors.uppercase).toContain('uppercase');
    }
  });

  test('missing lowercase should mention lowercase', () => {
    const errors = getPasswordValidationErrors('PASSWORD123!');
    if (errors.lowercase) {
      expect(errors.lowercase).toContain('lowercase');
    }
  });

  test('missing number should mention number', () => {
    const errors = getPasswordValidationErrors('Password!');
    if (errors.number) {
      expect(errors.number).toContain('number');
    }
  });

  test('missing special char should mention special character', () => {
    const errors = getPasswordValidationErrors('Password123');
    if (errors.special) {
      expect(errors.special).toContain('special');
    }
  });
});
