// app/api/auth/me/route.ts - Get current user profile with role
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to decode JWT token
function decodeJWT(token: string): { sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode JWT to get user_id
    const payload = decodeJWT(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.sub;

    // Fetch user profile with role from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        full_name,
        phone_number,
        branch_id,
        is_active,
        role:roles!role_id (
          role_id,
          role_name,
          description
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Return user profile with role name
    return NextResponse.json({
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      branch_id: profile.branch_id,
      is_active: profile.is_active,
      role: profile.role?.role_name || 'employee',
      role_id: profile.role?.role_id,
      role_description: profile.role?.description,
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}