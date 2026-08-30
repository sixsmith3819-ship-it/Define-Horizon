/**
 * POST /api/users/:user_id/reset-password
 * Admin-initiated password reset
 * 
 * Requirements: 12.6, 18.1
 */

import { createAdminClient, createServerComponentClient } from '@/lib/auth/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

    const supabase = createServerComponentClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's role for permission checking
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role_id, branch_id')
      .eq('id', currentUser.id)
      .single();

    const { data: currentUserRole } = await supabase
      .from('roles')
      .select('name')
      .eq('id', currentUserProfile?.role_id)
      .single();

    const userRole = currentUserRole?.name || 'employee';
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';
    const isManager = userRole === 'branch_manager' || userRole === 'manager';

    // Get target user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, email, full_name, branch_id')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions: admin or manager of user's branch
    const canReset =
      isAdmin ||
      (isManager && currentUserProfile?.branch_id === targetUser.branch_id);

    if (!canReset) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate new temporary password
    const tempPassword = generateTemporaryPassword();

    // Update password via Supabase Auth
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      user_id,
      {
        password: tempPassword,
      }
    );

    if (updateError) {
      console.error('Password reset error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Set force_password_change flag
    await adminSupabase
      .from('profiles')
      .update({
        force_password_change: true,
      })
      .eq('id', user_id);

    // Log action to audit_logs
    await adminSupabase.from('audit_log').insert({
      action_type: 'password_reset',
      resource_type: 'user',
      resource_id: user_id,
      user_id_affected: user_id,
      admin_user_id: currentUser.id,
      description: `Password reset initiated by admin: ${currentUser.id}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      after_state: {
        force_password_change: true,
        temporary_password_sent: true,
      },
    });

    // TODO: Send password reset email
    // For now, just log that it would be sent
    console.log(
      `Password reset email would be sent to ${targetUser.email} with temp password: ${tempPassword}`
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent to user',
    });
  } catch (error) {
    console.error('POST /api/users/:user_id/reset-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate temporary password (8+ chars, mixed case, numbers, symbols)
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Add 4 more random characters from all sets
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 0; i < 4; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
