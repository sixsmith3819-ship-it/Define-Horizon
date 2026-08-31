import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let query = supabase.from('branches').select('*').order('date_created', { ascending: false });

    if (search) {
      query = query.ilike('branch_name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('branches')
      .insert([
        {
          branch_name: body.branch_name,
          branch_code: body.branch_code,
          address: body.address,
          phone_number: body.phone_number || null,
          is_active: true,
          date_created: new Date().toISOString(),
          date_modified: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
