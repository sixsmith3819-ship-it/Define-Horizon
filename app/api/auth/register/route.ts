import { createAdminClient } from '@/lib/auth/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone_number, password } = body;

    // Validation
    if (!full_name || !email || !phone_number || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate phone number format (Zimbabwe)
    const phoneRegex = /^\+?263\d{9,10}$/;
    if (!phoneRegex.test(phone_number.replace(/[\s-]/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid Zimbabwe phone number format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Get the default branch (first branch)
    const { data: defaultBranch } = await supabase
      .from('branches')
      .select('branch_id')
      .limit(1)
      .single();

    if (!defaultBranch) {
      return NextResponse.json(
        { error: 'No branches available. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Get employee role ID
    const { data: employeeRole } = await supabase
      .from('roles')
      .select('role_id')
      .eq('role_name', 'employee')
      .single();

    if (!employeeRole) {
      return NextResponse.json(
        { error: 'Employee role not found. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create profile - ACTIVE by default for immediate access
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: authData.user.id,
          email: email.toLowerCase(),
          full_name: full_name,
          phone_number: phone_number,
          role_id: employeeRole.role_id,
          branch_id: defaultBranch.branch_id,
          is_active: true, // Active immediately - no approval needed
          status: 'Active',
        },
      ]);

    if (profileError) {
      console.error('Profile error:', profileError);
      
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. You can now login.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Server error during registration' },
      { status: 500 }
    );
  }
}