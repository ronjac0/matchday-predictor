/**
 * Authentication helper functions
 */

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, '_');
}

export function getAuthErrorMessage(error: string): string {
  const messages: { [key: string]: string } = {
    'Invalid login credentials': 'Email or password is incorrect',
    'Email already registered': 'This email is already in use',
    'Email not confirmed': 'Please check your email to confirm your account',
    'User already exists':
      'An account with this email already exists',
    'New password should be different from the old password':
      'Your new password must be different from your current password',
  };

  return messages[error] || error || 'An error occurred during authentication';
}
