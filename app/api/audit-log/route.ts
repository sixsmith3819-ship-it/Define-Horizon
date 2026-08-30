// app/api/audit-log/route.ts - Audit logging API endpoints

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/audit-log - Create audit log entry
 * Logs user actions for compliance and auditing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, resource_type, resource_id, details, user_id } = body;

    // Validate required fields
    if (!action || !resource_type || !resource_id) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resource_type, resource_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('audit_log')
      .insert([
        {
          action_type: action,
          resource_type,
          resource_id,
          description: details || '',
          user_id_affected: user_id,
          admin_user_id: user_id,
          timestamp: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Failed to log action' }, { status: 500 });
  }
}

/**
 * GET /api/audit-log - Fetch audit logs with pagination
 * Supports filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const actionType = searchParams.get('actionType');
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false });

    // Apply filters if provided
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      pagination: { limit, offset, total: count || 0 },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
