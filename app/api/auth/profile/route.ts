import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get cookies from request
    const cookieStore = request.cookies;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${cookieStore.get('sb-auth-token')?.value || cookieStore.get('sb-access-token')?.value}`,
          },
        },
      }
    );

    // Get the authenticated user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with role - use 'id' column, not 'user_id'
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, role:role_id(name, description)')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
