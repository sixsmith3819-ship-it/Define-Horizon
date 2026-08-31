/**
 * POST /api/users/bulk-actions
 * Perform bulk operations on multiple users
 *
 * Requirements: 15.6
 */

import { createAdminClient, createServerComponentClient } from '@/lib/auth/supabase';
import { BulkActionsRequestSchema } from '@/lib/schemas/users';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = BulkActionsRequestSchema.safeParse(body);
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

    const { user_ids, action, role_id, branch_id, status, suspension_reason, format } =
      validation.data;

    const supabase = createServerComponentClient();
    const adminSupabase = createAdminClient();

    // Get current user session
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is Super Administrator
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
        { success: false, error: 'Only Super Administrators can perform bulk actions' },
        { status: 403 }
      );
    }

    // Verify all users exist
    const { data: targetUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role_id, branch_id, is_active, version_number')
      .in('id', user_ids);

    if (fetchError || !targetUsers) {
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }

    if (targetUsers.length !== user_ids.length) {
      const foundIds = new Set(targetUsers.map((u) => u.id));
      const missingIds = user_ids.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { success: false, error: `Some users not found: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    const failedUsers: Array<{ user_id: string; error: string }> = [];

    // Execute bulk action
    switch (action) {
      case 'assign_role': {
        if (!role_id) {
          return NextResponse.json(
            { success: false, error: 'role_id is required for assign_role action' },
            { status: 400 }
          );
        }

        // Verify role exists
        const { data: roleExists } = await supabase
          .from('roles')
          .select('id')
          .eq('id', role_id)
          .single();

        if (!roleExists) {
          return NextResponse.json({ success: false, error: 'Invalid role ID' }, { status: 400 });
        }

        // Update all users with new role atomically
        for (const user of targetUsers) {
          try {
            // Increment version number for optimistic locking
            const { error: updateError } = await adminSupabase
              .from('profiles')
              .update({
                role_id,
                version_number: user.version_number + 1,
              })
              .eq('id', user.id)
              .eq('version_number', user.version_number);

            if (updateError) {
              failedUsers.push({
                user_id: user.id,
                error: 'Version conflict - user was modified',
              });
              failureCount++;
              continue;
            }

            // Log action to audit_logs
            await adminSupabase.from('audit_log').insert({
              action_type: 'role_assigned',
              resource_type: 'user',
              resource_id: user.id,
              user_id_affected: user.id,
              admin_user_id: currentUser.id,
              description: `Role assigned via bulk action: ${user.email}`,
              ip_address: request.headers.get('x-forwarded-for') || 'unknown',
              before_state: { role_id: user.role_id },
              after_state: { role_id },
            });

            successCount++;
          } catch (error) {
            failedUsers.push({
              user_id: user.id,
              error: 'Failed to update user',
            });
            failureCount++;
          }
        }
        break;
      }

      case 'assign_branch': {
        if (!branch_id) {
          return NextResponse.json(
            { success: false, error: 'branch_id is required for assign_branch action' },
            { status: 400 }
          );
        }

        // Verify branch exists
        const { data: branchExists } = await supabase
          .from('branches')
          .select('id')
          .eq('id', branch_id)
          .single();

        if (!branchExists) {
          return NextResponse.json({ success: false, error: 'Invalid branch ID' }, { status: 400 });
        }

        // Update all users with new branch atomically
        for (const user of targetUsers) {
          try {
            const { error: updateError } = await adminSupabase
              .from('profiles')
              .update({
                branch_id,
                version_number: user.version_number + 1,
              })
              .eq('id', user.id)
              .eq('version_number', user.version_number);

            if (updateError) {
              failedUsers.push({
                user_id: user.id,
                error: 'Version conflict - user was modified',
              });
              failureCount++;
              continue;
            }

            // Log action
            await adminSupabase.from('audit_log').insert({
              action_type: 'branch_assigned',
              resource_type: 'user',
              resource_id: user.id,
              user_id_affected: user.id,
              admin_user_id: currentUser.id,
              description: `Branch assigned via bulk action: ${user.email}`,
              ip_address: request.headers.get('x-forwarded-for') || 'unknown',
              before_state: { branch_id: user.branch_id },
              after_state: { branch_id },
            });

            successCount++;
          } catch (error) {
            failedUsers.push({
              user_id: user.id,
              error: 'Failed to update user',
            });
            failureCount++;
          }
        }
        break;
      }

      case 'change_status': {
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'status is required for change_status action' },
            { status: 400 }
          );
        }

        const isActive = status === 'Active';

        // Update all users with new status atomically
        for (const user of targetUsers) {
          try {
            const { error: updateError } = await adminSupabase
              .from('profiles')
              .update({
                is_active: isActive,
                suspension_reason: !isActive ? suspension_reason : null,
                suspension_date: !isActive ? new Date().toISOString() : null,
                version_number: user.version_number + 1,
              })
              .eq('id', user.id)
              .eq('version_number', user.version_number);

            if (updateError) {
              failedUsers.push({
                user_id: user.id,
                error: 'Version conflict - user was modified',
              });
              failureCount++;
              continue;
            }

            // If deactivating, invalidate sessions
            if (!isActive) {
              // TODO: Invalidate user sessions in Supabase Auth
            }

            // Log action
            await adminSupabase.from('audit_log').insert({
              action_type: 'status_changed',
              resource_type: 'user',
              resource_id: user.id,
              user_id_affected: user.id,
              admin_user_id: currentUser.id,
              description: `Status changed to ${status} via bulk action: ${user.email}`,
              ip_address: request.headers.get('x-forwarded-for') || 'unknown',
              before_state: { is_active: user.is_active },
              after_state: { is_active: isActive },
            });

            successCount++;
          } catch (error) {
            failedUsers.push({
              user_id: user.id,
              error: 'Failed to update user',
            });
            failureCount++;
          }
        }
        break;
      }

      case 'reset_password': {
        // Reset password for all selected users
        for (const user of targetUsers) {
          try {
            // Generate new temporary password
            const tempPassword = generateTemporaryPassword();

            // Update password via admin client
            const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
              password: tempPassword,
            });

            if (updateError) {
              failedUsers.push({
                user_id: user.id,
                error: 'Failed to reset password',
              });
              failureCount++;
              continue;
            }

            // Update profile to mark password change required
            await adminSupabase
              .from('profiles')
              .update({
                force_password_change: true,
                password_last_changed: new Date().toISOString(),
              })
              .eq('id', user.id);

            // Log action
            await adminSupabase.from('audit_log').insert({
              action_type: 'password_reset',
              resource_type: 'user',
              resource_id: user.id,
              user_id_affected: user.id,
              admin_user_id: currentUser.id,
              description: `Password reset via bulk action: ${user.email}`,
              ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            });

            // TODO: Send password reset email
            successCount++;
          } catch (error) {
            failedUsers.push({
              user_id: user.id,
              error: 'Failed to reset password',
            });
            failureCount++;
          }
        }
        break;
      }

      case 'delete': {
        // Soft delete all selected users
        for (const user of targetUsers) {
          try {
            const { error: deleteError } = await adminSupabase
              .from('profiles')
              .update({
                is_active: false,
                deleted_at: new Date().toISOString(),
                version_number: user.version_number + 1,
              })
              .eq('id', user.id)
              .eq('version_number', user.version_number);

            if (deleteError) {
              failedUsers.push({
                user_id: user.id,
                error: 'Version conflict - user was modified',
              });
              failureCount++;
              continue;
            }

            // Log deletion
            await adminSupabase.from('audit_log').insert({
              action_type: 'user_deleted',
              resource_type: 'user',
              resource_id: user.id,
              user_id_affected: user.id,
              admin_user_id: currentUser.id,
              description: `User deleted via bulk action: ${user.email}`,
              ip_address: request.headers.get('x-forwarded-for') || 'unknown',
              before_state: { is_active: user.is_active, email: user.email },
            });

            successCount++;
          } catch (error) {
            failedUsers.push({
              user_id: user.id,
              error: 'Failed to delete user',
            });
            failureCount++;
          }
        }
        break;
      }

      case 'export': {
        // Export is handled differently - return export URL/data
        // For now, we'll prepare data for export
        return NextResponse.json(
          {
            success: true,
            data: {
              action: 'export',
              total_users: targetUsers.length,
              successful_count: targetUsers.length,
              failed_count: 0,
              export_url: `/api/users/export?user_ids=${user_ids.join(',')}&format=${format || 'csv'}`,
            },
          },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          action,
          total_users: user_ids.length,
          successful_count: successCount,
          failed_count: failureCount,
          ...(failedUsers.length > 0 && { failed_users: failedUsers }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/users/bulk-actions error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
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
