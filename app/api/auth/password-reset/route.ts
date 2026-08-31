/**
 * POST /api/auth/password-reset
 *
 * Initiates password reset process by:
 * 1. Validating email format
 * 2. Checking if email exists (silently)
 * 3. Calling Supabase auth.resetPasswordForEmail()
 * 4. Logging the reset request to audit_log
 * 5. Returning generic success message (don't disclose if email exists)
 *
 * Requirements: 17.7, 18.1
 */

import { createAdminClient } from '@/lib/auth/supabase';
import { PasswordResetRequestSchema } from '@/lib/schemas/auth';
import { NextRequest, NextResponse } from 'next/server';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = PasswordResetRequestSchema.safeParse(body);

    if (!validation.success) {
      // Return generic success message even on validation error (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a password reset link will be sent',
      });
    }

    const { email } = validation.data;
    const ipAddress = getClientIP(request);
    const supabase = createAdminClient();

    // Check if email exists in profiles (don't leak this information)
    const { data: profileExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileExists) {
      // Email exists - proceed with password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        // Still return generic success message
      }

      // Log password reset request to audit_log
      await supabase.from('audit_log').insert({
        action_type: 'password_reset_requested',
        resource_type: 'auth',
        resource_id: profileExists.id,
        user_id_affected: profileExists.id,
        description: 'Password reset requested',
        ip_address: ipAddress,
        after_state: {
          email,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Email doesn't exist - still log for security audit
      await supabase.from('audit_log').insert({
        action_type: 'password_reset_requested_nonexistent',
        resource_type: 'auth',
        description: `Password reset requested for non-existent email: ${email}`,
        ip_address: ipAddress,
        after_state: {
          email,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Always return generic success message
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link will be sent',
    });
  } catch (error) {
    console.error('Password reset error:', error);

    // Return generic success message on error (security best practice)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link will be sent',
    });
  }
}
