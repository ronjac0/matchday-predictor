'use server';

import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import {
  validateEmail,
  validatePassword,
  validateUsername,
  type ValidationError,
} from '@/lib/validation';

/**
 * Sign Up with Email and Password
 */
export async function signUp(formData: FormData): Promise<{
  success: boolean;
  errors?: ValidationError;
  message?: string;
}> {
  const email = formData.get('email')?.toString().trim() || '';
  const password = formData.get('password')?.toString() || '';
  const confirmPassword = formData.get('confirmPassword')?.toString() || '';
  const username = formData.get('username')?.toString().trim() || '';
  const fullName = formData.get('fullName')?.toString().trim() || '';

  const errors: ValidationError = {};

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  // Validate confirm password
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Validate username
  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  // Return early if there are validation errors
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          message: 'This email is already registered. Please log in instead.',
        };
      }
      return {
        success: false,
        message: authError.message || 'Failed to create account',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: 'Failed to create account',
      };
    }

    // Create user profile matching our EXACT database schema
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        display_name: username || fullName || email.split('@')[0],
        wallet_balance: 1000, // No decimals needed since it's an INTEGER column
      },
    ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return {
        success: false,
        message: 'Account created, but profile setup failed',
      };
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to confirm.',
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      message: error?.message || 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Sign In with Email and Password
 */
export async function signIn(formData: FormData): Promise<{
  success: boolean;
  errors?: ValidationError;
  message?: string;
}> {
  const email = formData.get('email')?.toString().trim() || '';
  const password = formData.get('password')?.toString() || '';

  const errors: ValidationError = {};

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  // Return early if there are validation errors
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  let isSuccessful = false;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Don't reveal if email exists or not for security
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }

    isSuccessful = true;
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      message: error?.message || 'An unexpected error occurred. Please try again.',
    };
  }

  // Execute redirect outside of try/catch
  if (isSuccessful) {
    redirect('/dashboard');
  }
  
  return { success: false, message: 'Redirect failed' };
}

/**
 * Sign Out
 */
export async function signOut() {
  let isSuccessful = false;

  try {
    await supabase.auth.signOut();
    isSuccessful = true;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }

  // Execute redirect outside of try/catch
  if (isSuccessful) {
    redirect('/auth');
  }
}