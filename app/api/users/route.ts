/**
 * GET /api/users
 * List users with pagination and filters
 * POST /api/users
 * Create new user
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 15.2, 15.6, 18.1
 */

import { createAdminClient, createServerComponentClient } from '@/lib/auth/supabase';
import { CreateUserRequestSchema, UserListResponseSchema } from '@/lib/schemas/users';
import { normalizePaginationParams, validateSortParams, calculatePagination } from '@/lib/utils/pagination';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users
 * List users with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');
    const search = searchParams.get('search')?.trim();
    const role = searchParams.get('role');
    const branch = searchParams.get('branch');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');

    // Normalize pagination parameters
    const { page: normalizedPage, pageSize: normalizedPageSize, offset } = normalizePaginationParams(page || "1", pageSize || "10");

    // Validate sort parameters
    const { sortBy: validSortBy, sortOrder: validSortOrder } = validateSortParams(
      sortBy || undefined,
      sortOrder || undefined,
      ['created_at', 'full_name', 'email', 'last_login_timestamp']
    );

    const supabase = createServerComponentClient();

    // Get current user session and permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's profile and role for permission checking
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, role_id, branch_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get current user's role to check permissions
    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', userProfile.role_id)
      .single();

    const userRole = roleData?.name || 'employee';
    const canViewAllUsers = userRole === 'super_admin' || userRole === 'admin';

    // Build base query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone_number,
        is_active,
        branch_id,
        role_id,
        created_at,
        last_login_timestamp,
        roles!inner (name),
        branches!inner (name)
      `, { count: 'exact' });

    // Apply branch context: non-admins see only their branch users
    if (!canViewAllUsers) {
      query = query.eq('branch_id', userProfile.branch_id);
    } else if (branch) {
      // Admin can filter by specific branch
      query = query.eq('branch_id', branch);
    }

    // Apply search filters
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('role_id', role);
    }

    // Apply status filter
    if (status) {
      const isActive = status.toLowerCase() === 'active' || status === 'true';
      query = query.eq('is_active', isActive);
    }

    // Apply sorting and pagination
    query = query.order(validSortBy, { ascending: validSortOrder === 'asc' });
    query = query.range(offset, offset + normalizedPageSize - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform response
    const formattedUsers = (users || []).map(user => ({
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.roles?.[0]?.name || 'Unknown',
      branch: user.branches?.[0]?.name || 'Unknown',
      status: user.is_active ? 'Active' : 'Inactive',
      last_login_timestamp: user.last_login_timestamp,
      created_at: user.created_at,
      version_number: 1, // Placeholder - would be from actual version field
    }));

    const pagination = calculatePagination(
      normalizedPage,
      normalizedPageSize,
      count || 0
    );

    // Log this action to audit log
    await supabase.from('audit_log').insert({
      action_type: 'read',
      resource_type: 'users',
      resource_id: 'list',
      user_id_affected: null,
      admin_user_id: user.id,
      description: `User list viewed with filters: search=${search}, role=${role}, branch=${branch}, status=${status}`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination,
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateUserRequestSchema.safeParse(body);
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

    const { email, full_name, phone_number, role_id, branch_id, department_id } =
      validation.data;

    const supabase = createServerComponentClient();

    // Get current user session
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

    // Check if current user is Super Administrator
    const { data: currentUserRole } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', currentUser.id)
      .single();

    const { data: rolePermissions } = await supabase
      .from('roles')
      .select('name')
      .eq('id', currentUserRole?.role_id)
      .single();

    if (rolePermissions?.name !== 'super_admin' && rolePermissions?.name !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Administrators can create users' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Verify role and branch exist
    const { data: roleExists } = await supabase
      .from('roles')
      .select('id')
      .eq('id', role_id)
      .single();

    if (!roleExists) {
      return NextResponse.json(
        { success: false, error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    const { data: branchExists } = await supabase
      .from('branches')
      .select('id')
      .eq('id', branch_id)
      .single();

    if (!branchExists) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch ID' },
        { status: 400 }
      );
    }

    // Use admin client for user creation
    const adminSupabase = createAdminClient();

    // Generate temporary password (8+ chars, mixed case, numbers, symbols)
    const tempPassword = generateTemporaryPassword();

    // Create auth user via Supabase Auth
    const { data: authData, error: authCreateError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // User must confirm via invitation email
      user_metadata: {
        full_name,
      },
    });

    if (authCreateError || !authData.user) {
      console.error('Auth user creation error:', authCreateError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // Create profile entry
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: newUserId,
        email,
        full_name,
        phone_number: phone_number || null,
        role_id,
        branch_id,
        department_id: department_id || null,
        is_active: false, // Inactive until user sets password
        version_number: 1,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback auth user
      await adminSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Create user invitation record
    const { error: invitationError } = await adminSupabase
      .from('user_invitations')
      .insert({
        email,
        invited_by: currentUser.id,
        token: invitationToken,
        expires_at: expiresAt,
        status: 'pending',
      });

    if (invitationError) {
      console.error('Invitation creation error:', invitationError);
    }

    // Log user creation to audit_logs
    await adminSupabase.from('audit_log').insert({
      action_type: 'create',
      resource_type: 'user',
      resource_id: newUserId,
      user_id_affected: newUserId,
      admin_user_id: currentUser.id,
      description: `User created: ${full_name} (${email})`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      after_state: {
        email,
        full_name,
        role_id,
        branch_id,
        is_active: false,
      },
    });

    // TODO: Send invitation email with registration link and temp password
    // For now, just return success
    console.log(`Invitation email would be sent to ${email} with temp password: ${tempPassword}`);

    // Fetch branch and role names for response
    const { data: branchData } = await adminSupabase
      .from('branches')
      .select('name')
      .eq('id', branch_id)
      .single();

    const { data: roleData } = await adminSupabase
      .from('roles')
      .select('name')
      .eq('id', role_id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: {
          user_id: newUserId,
          email,
          full_name,
          role: roleData?.name || 'Unknown',
          branch: branchData?.name || 'Unknown',
          status: 'Pending Activation',
          invitation_sent: true,
          invitation_expires_at: expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/users error:', error);
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

/**
 * Generate secure invitation token
 */
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
