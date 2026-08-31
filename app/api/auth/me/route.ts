import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper function to decode JWT token
function decodeJWT(token: string): { sub?: string; email?: string; [key: string]: unknown } | null {
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = decodeJWT(token);
    
    if (!decoded?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: authHeader,
        },
      },
    });

    // Query profiles with role name join
    const selectQuery = `id,
        email,
        full_name,
        phone_number,
        role_id,
        branch_id,
        is_active,
        roles (
          id,
          name
        )`;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(selectQuery)
      .eq('email', decoded.email)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Map role name from the joined roles object (it's an array, get first item)
    const rolesArray = profile.roles as Array<{ id: string; name: string }> | null;
    const roleData = rolesArray?.[0];
    const roleName = roleData?.name || 'employee';

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      role_id: profile.role_id,
      branch_id: profile.branch_id,
      role: roleName,
      is_active: profile.is_active,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
