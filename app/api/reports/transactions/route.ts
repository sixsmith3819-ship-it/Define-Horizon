import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 25;
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*')
      .range(from, from + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      pagination: { page, limit, total: count || 0 },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
