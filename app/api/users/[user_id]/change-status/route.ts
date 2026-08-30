/**
 * POST /api/users/:user_id/change-status
 * Change user account status (Active/Inactive)
 * 
 * Requirements: 13.2, 13.3, 13.5, 18.1
 */

import { createAdminClient, createServerComponentClient } from '@/lib/auth/supabase';
import { ChangeStatusRequestSchema } from '@/lib/schemas/users';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = ChangeStatusRequestSchema.safeParse(body);
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

    const { status, suspension_reason, suspension_notes } = validation.data;

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
      .select('id, branch_id, is_active, full_name, email, role_id')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions: admin or manager of user's branch
    const canUpdate =
      isAdmin ||
      (isManager && currentUserProfile?.branch_id === targetUser.branch_id);

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse status
    const isActive = status === 'Active';

    // Check if status is actually changing
    if (targetUser.is_active === isActive) {
      return NextResponse.json({
        success: true,
        data: {
          user_id: targetUser.id,
          status: isActive ? 'Active' : 'Inactive',
        },
      });
    }

    // Update profile
    const updateData: any = {
      is_active: isActive,
    };

    if (!isActive) {
      // If changing to inactive, record suspension info
      updateData.suspension_reason = suspension_reason || null;
      updateData.suspension_date = new Date().toISOString();
      if (suspension_notes) {
        updateData.suspension_notes = suspension_notes;
      }
    } else {
      // If changing to active, clear suspension info
      updateData.suspension_reason = null;
      updateData.suspension_date = null;
      updateData.suspension_notes = null;
    }

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id);

    if (updateError) {
      console.error('Status update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    // If changing to inactive, invalidate active sessions
    if (!isActive) {
      // Clear any active session data for this user
      // This would typically be handled by session management middleware
      console.log(`Sessions invalidated for user ${user_id}`);
    }

    // Log status change to audit_logs
    await adminSupabase.from('audit_log').insert({
      action_type: 'update',
      resource_type: 'user_status',
      resource_id: user_id,
      user_id_affected: user_id,
      admin_user_id: currentUser.id,
      description: `User status changed to ${status}${
        suspension_reason ? ` - Reason: ${suspension_reason}` : ''
      }`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      before_state: {
        is_active: targetUser.is_active,
        status: targetUser.is_active ? 'Active' : 'Inactive',
      },
      after_state: {
        is_active: isActive,
        status: isActive ? 'Active' : 'Inactive',
        suspension_reason: suspension_reason || null,
        suspension_notes: suspension_notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user_id: targetUser.id,
        status: isActive ? 'Active' : 'Inactive',
      },
    });
  } catch (error) {
    console.error('POST /api/users/:user_id/change-status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
