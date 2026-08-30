/**
 * POST /api/users/:user_id/force-password-change
 * Force user to change password on next login
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
      .select('role_id')
      .eq('id', currentUser.id)
      .single();

    const { data: currentUserRole } = await supabase
      .from('roles')
      .select('name')
      .eq('id', currentUserProfile?.role_id)
      .single();

    const userRole = currentUserRole?.name || 'employee';
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';

    // Only admins can force password change
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can force password changes' },
        { status: 403 }
      );
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, full_name, force_password_change')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Set force_password_change flag
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        force_password_change: true,
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Force password change error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to force password change' },
        { status: 500 }
      );
    }

    // Log action to audit_logs
    await adminSupabase.from('audit_log').insert({
      action_type: 'force_password_change',
      resource_type: 'user',
      resource_id: user_id,
      user_id_affected: user_id,
      admin_user_id: currentUser.id,
      description: `User forced to change password on next login`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      after_state: {
        force_password_change: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User will be required to change password on next login',
    });
  } catch (error) {
    console.error('POST /api/users/:user_id/force-password-change error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
