import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branch_id');

    if (!branchId) {
      return NextResponse.json({ error: 'branch_id required' }, { status: 400 });
    }

    const [empRes, custRes, transRes] = await Promise.all([
      supabase.from('profiles').select('user_id').eq('branch_id', branchId),
      supabase.from('customers').select('id').eq('branch_id', branchId),
      supabase.from('transactions').select('id').eq('branch_id', branchId),
    ]);

    return NextResponse.json({
      employeeCount: empRes.data?.length || 0,
      customerCount: custRes.data?.length || 0,
      transactionCount: transRes.data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching branch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
