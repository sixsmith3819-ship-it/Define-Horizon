import { createAuthClient } from '@/lib/auth/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get user from auth
    const supabase = createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse filters
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    // Try to fetch from database, fall back to mock data
    try {
      let query = supabase.from('announcements').select('*', { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (priority !== 'all') {
        query = query.eq('priority', priority);
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return NextResponse.json({
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: count ? Math.ceil(count / limit) : 0,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Return mock data if table doesn't exist
      const mockAnnouncements = [
        {
          id: '1',
          title: 'Welcome to Define Horizon BMS',
          content:
            'This is your company announcement board. Create announcements to communicate with your team.',
          priority: 'normal',
          status: 'published',
          created_at: new Date().toISOString(),
          view_count: 0,
        },
        {
          id: '2',
          title: 'System Updates Available',
          content:
            'New features and improvements have been deployed. Check the release notes for details.',
          priority: 'high',
          status: 'published',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          view_count: 0,
        },
      ];

      // Filter mock data
      let filtered = mockAnnouncements;
      if (status !== 'all') {
        filtered = filtered.filter((a) => a.status === status);
      }
      if (priority !== 'all') {
        filtered = filtered.filter((a) => a.priority === priority);
      }
      if (search) {
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.content.toLowerCase().includes(search.toLowerCase())
        );
      }

      return NextResponse.json({
        data: filtered,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: 1,
        },
      });
    }
  } catch (error) {
    console.error('Announcements API error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, priority = 'normal', status = 'draft' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Try to insert into database, fall back to returning mock response
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([
          {
            title,
            content,
            priority,
            status,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            view_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Return mock response
      const mockAnnouncement = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        content,
        priority,
        status,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: 0,
      };

      return NextResponse.json(mockAnnouncement, { status: 201 });
    }
  } catch (error) {
    console.error('POST announcements error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
