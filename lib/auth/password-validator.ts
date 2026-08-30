/**
 * Password Validation Utility
 * 
 * Validates password complexity requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*)
 * - Cannot contain user's email
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidationErrors {
  length?: string;
  uppercase?: string;
  lowercase?: string;
  number?: string;
  special?: string;
  email?: string;
}

export function validatePassword(password: string, email?: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least 1 uppercase letter (A-Z)');
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least 1 lowercase letter (a-z)');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least 1 number (0-9)');
  }

  // Check for special character
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Must contain at least 1 special character (!@#$%^&*)');
  }

  // Check that password doesn't contain email
  if (email) {
    const emailLocalPart = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailLocalPart)) {
      errors.push('Password cannot contain your email address');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordValidationErrors(password: string, email?: string): PasswordValidationErrors {
  const result = validatePassword(password, email);
  const errorMap: PasswordValidationErrors = {};

  result.errors.forEach(error => {
    if (error.includes('8 characters')) {
      errorMap.length = error;
    } else if (error.includes('uppercase')) {
      errorMap.uppercase = error;
    } else if (error.includes('lowercase')) {
      errorMap.lowercase = error;
    } else if (error.includes('number')) {
      errorMap.number = error;
    } else if (error.includes('special')) {
      errorMap.special = error;
    } else if (error.includes('email')) {
      errorMap.email = error;
    }
  });

  return errorMap;
}
