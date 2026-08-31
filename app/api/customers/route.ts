import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/auth/supabase';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to extract user from auth token
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

async function getAuthenticatedUser(request: NextRequest) {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // If no auth header, try cookies
  if (!token) {
    const sessionCookie = request.cookies.get('auth_session');
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        token = sessionData.access_token;
      } catch {
        // Cookie parse failed
      }
    }
  }

  if (!token) {
    return null;
  }

  // Decode token to get user ID
  const tokenPayload = decodeJWT(token);
  if (!tokenPayload?.sub) {
    return null;
  }

  const userId = tokenPayload.sub;

  // Fetch user profile with branch info
  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('user_id, email, full_name, branch_id, role_id, is_active')
    .eq('user_id', userId)
    .single();

  if (error || !profile || !profile.is_active) {
    return null;
  }

  return profile;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const body = await request.json();

    // Map frontend field names to database column names
    const customerData = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email || null,
      phone_number: body.phone || body.phone_number, // Support both field names
      customer_type: body.customer_type,
      physical_address: body.address || body.physical_address || null, // Support both field names
      branch_id: user.branch_id, // Use authenticated user''s branch
      created_by: user.user_id, // Use authenticated user''s ID
    };

    const { data, error } = await supabase.from('customers').insert([customerData]).select();

    if (error) {
      console.error('Database error creating customer:', error);
      throw error;
    }

    return NextResponse.json(data?.[0] || {}, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);

    // Return more specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
