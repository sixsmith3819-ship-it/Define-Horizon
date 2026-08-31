/**
 * GET /api/users/:user_id
 * Get user details with activity history
 * PUT /api/users/:user_id
 * Update user account
 * DELETE /api/users/:user_id
 * Delete user account (soft delete)
 *
 * Requirements: 12.7, 13.7, 19.8
 */

import { createAdminClient, createServerComponentClient } from '@/lib/auth/supabase';
import { UpdateUserRequestSchema } from '@/lib/schemas/users';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/:user_id
 * Get user details with profile, activity history, and audit log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

    const supabase = createServerComponentClient();

    // Get current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile for permission checking
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role_id, branch_id')
      .eq('id', currentUser.id)
      .single();

    // Get current user's role
    const { data: currentUserRole } = await supabase
      .from('roles')
      .select('name')
      .eq('id', currentUserProfile?.role_id)
      .single();

    const userRole = currentUserRole?.name || 'employee';
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';
    const isManager = userRole === 'branch_manager' || userRole === 'manager';

    // Get target user profile
    const { data: targetUser } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        phone_number,
        is_active,
        branch_id,
        role_id,
        created_at,
        last_login_timestamp,
        version_number,
        roles!inner (name),
        branches!inner (name)
      `
      )
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check permissions: self, admin, or branch manager of user's branch
    const canView =
      currentUser.id === user_id ||
      isAdmin ||
      (isManager && currentUserProfile?.branch_id === targetUser.branch_id);

    if (!canView) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get login history (last 5)
    const { data: loginHistory } = await supabase
      .from('login_history')
      .select('login_timestamp, ip_address, device_type, session_id')
      .eq('user_id', user_id)
      .order('login_timestamp', { ascending: false })
      .limit(5);

    // Calculate session duration (placeholder - would use actual duration field)
    const formattedLoginHistory = (loginHistory || []).map((login) => ({
      login_timestamp: login.login_timestamp,
      ip_address: login.ip_address,
      device_type: login.device_type,
      duration_seconds: 0, // Placeholder
    }));

    // Get audit log (last 10)
    const { data: auditLog } = await supabase
      .from('audit_log')
      .select('created_at, action_type, description')
      .eq('user_id_affected', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedAuditLog = (auditLog || []).map((log) => ({
      timestamp: log.created_at,
      action_type: log.action_type,
      description: log.description,
    }));

    return NextResponse.json({
      success: true,
      data: {
        user_id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        phone_number: targetUser.phone_number,
        role: targetUser.roles?.[0]?.name || 'Unknown',
        branch: targetUser.branches?.[0]?.name || 'Unknown',
        status: targetUser.is_active ? 'Active' : 'Inactive',
        created_at: targetUser.created_at,
        last_login_timestamp: targetUser.last_login_timestamp,
        login_history: formattedLoginHistory,
        audit_log: formattedAuditLog,
      },
    });
  } catch (error) {
    console.error('GET /api/users/:user_id error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/:user_id
 * Update user account with optimistic locking
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = UpdateUserRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { full_name, phone_number, role_id, branch_id, department_id, version_number } =
      validation.data;

    const supabase = createServerComponentClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
      .select('id, branch_id, version_number, email, full_name, phone_number, role_id')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check permissions
    const canUpdate =
      currentUser.id === user_id ||
      isAdmin ||
      (isManager && currentUserProfile?.branch_id === targetUser.branch_id);

    if (!canUpdate) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Check optimistic locking version
    if (version_number !== undefined && version_number !== targetUser.version_number) {
      // Get latest user data for conflict response
      const { data: latestUser } = await supabase
        .from('profiles')
        .select(
          `
          id,
          email,
          full_name,
          phone_number,
          is_active,
          branch_id,
          role_id,
          created_at,
          last_login_timestamp,
          version_number,
          roles!inner (name),
          branches!inner (name)
        `
        )
        .eq('id', user_id)
        .single();

      return NextResponse.json(
        {
          success: false,
          error: 'User record was modified by another admin. Please refresh and try again.',
          current_version: targetUser.version_number,
          your_version: version_number,
          latest_data: latestUser
            ? {
                user_id: latestUser.id,
                email: latestUser.email,
                full_name: latestUser.full_name,
                phone_number: latestUser.phone_number,
                role: latestUser.roles?.[0]?.name || 'Unknown',
                branch: latestUser.branches?.[0]?.name || 'Unknown',
                status: latestUser.is_active ? 'Active' : 'Inactive',
                created_at: latestUser.created_at,
                last_login_timestamp: latestUser.last_login_timestamp,
                version_number: latestUser.version_number,
              }
            : undefined,
        },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      version_number: (targetUser.version_number || 0) + 1,
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (department_id !== undefined) updateData.department_id = department_id;

    // Verify referenced records exist
    if (role_id) {
      const { data: roleExists } = await supabase
        .from('roles')
        .select('id')
        .eq('id', role_id)
        .single();
      if (!roleExists) {
        return NextResponse.json({ success: false, error: 'Invalid role ID' }, { status: 400 });
      }
    }

    if (branch_id) {
      const { data: branchExists } = await supabase
        .from('branches')
        .select('id')
        .eq('id', branch_id)
        .single();
      if (!branchExists) {
        return NextResponse.json({ success: false, error: 'Invalid branch ID' }, { status: 400 });
      }
    }

    // Update profile
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }

    // Log changes to audit_logs
    const changes: any = {};
    if (full_name !== undefined && full_name !== targetUser.full_name)
      changes.full_name = { old: targetUser.full_name, new: full_name };
    if (phone_number !== undefined && phone_number !== targetUser.phone_number)
      changes.phone_number = { old: targetUser.phone_number, new: phone_number };
    if (role_id !== undefined && role_id !== targetUser.role_id)
      changes.role_id = { old: targetUser.role_id, new: role_id };
    if (branch_id !== undefined && branch_id !== targetUser.branch_id)
      changes.branch_id = { old: targetUser.branch_id, new: branch_id };

    if (Object.keys(changes).length > 0) {
      await adminSupabase.from('audit_log').insert({
        action_type: 'update',
        resource_type: 'user',
        resource_id: user_id,
        user_id_affected: user_id,
        admin_user_id: currentUser.id,
        description: `User profile updated: ${Object.keys(changes).join(', ')}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        before_state: Object.fromEntries(
          Object.entries(changes).map(([key, value]: any) => [key, value.old])
        ),
        after_state: Object.fromEntries(
          Object.entries(changes).map(([key, value]: any) => [key, value.new])
        ),
      });
    }

    // Get updated user data
    const { data: updatedUser } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        phone_number,
        is_active,
        branch_id,
        role_id,
        created_at,
        last_login_timestamp,
        version_number,
        roles!inner (name),
        branches!inner (name)
      `
      )
      .eq('id', user_id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        user_id: updatedUser?.id,
        version_number: updatedUser?.version_number,
      },
    });
  } catch (error) {
    console.error('PUT /api/users/:user_id error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/:user_id
 * Soft delete user account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    const { searchParams } = request.nextUrl;
    const confirmEmail = searchParams.get('confirm_email');

    const supabase = createServerComponentClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify requester is Super Administrator
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

    if (currentUserRole?.name !== 'super_admin' && currentUserRole?.name !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Administrators can delete users' },
        { status: 403 }
      );
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify email confirmation
    if (!confirmEmail || confirmEmail.toLowerCase() !== targetUser.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email confirmation does not match' },
        { status: 400 }
      );
    }

    // Soft delete: set is_active=false and set deleted_at timestamp
    const { error: deleteError } = await adminSupabase
      .from('profiles')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (deleteError) {
      console.error('Profile deletion error:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }

    // Invalidate all active sessions for deleted user
    // This is typically handled by app/auth session management
    // For now, just log the deletion

    // Log deletion to audit_logs
    await adminSupabase.from('audit_log').insert({
      action_type: 'delete',
      resource_type: 'user',
      resource_id: user_id,
      user_id_affected: user_id,
      admin_user_id: currentUser.id,
      description: `User deleted: ${targetUser.full_name} (${targetUser.email})`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      before_state: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/users/:user_id error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
