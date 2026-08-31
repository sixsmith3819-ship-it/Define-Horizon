import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('branch_id', (await params).id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('branches')
      .update(body)
      .eq('branch_id', (await params).id)
      .select();

    if (error) throw error;

    return NextResponse.json(data?.[0] || {});
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('branch_id', (await params).id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
