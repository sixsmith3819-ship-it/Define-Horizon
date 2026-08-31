/**
 * GET /api/users/export
 * Export users to CSV, Excel, or PDF format
 *
 * Requirements: 11.3, 11.4, 11.5
 */

import { createServerComponentClient, createAdminClient } from '@/lib/auth/supabase';
import { ExportUsersRequestSchema } from '@/lib/schemas/users';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const userIdsParam = searchParams.get('user_ids');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const branch = searchParams.get('branch');
    const status = searchParams.get('status');

    // Validate format
    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json({ success: false, error: 'Invalid export format' }, { status: 400 });
    }

    const supabase = createServerComponentClient();
    const adminSupabase = createAdminClient();

    // Get current user session
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission: admin or auditor
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, role_id, branch_id')
      .eq('id', currentUser.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', userProfile.role_id)
      .single();

    const userRole = roleData?.name || 'employee';
    const canExport = userRole === 'super_admin' || userRole === 'admin' || userRole === 'auditor';

    if (!canExport) {
      return NextResponse.json(
        { success: false, error: 'Only admins and auditors can export users' },
        { status: 403 }
      );
    }

    // Build query to fetch users
    let query = supabase.from('profiles').select(`
        id,
        email,
        full_name,
        phone_number,
        is_active,
        branch_id,
        role_id,
        created_at,
        last_login_timestamp,
        login_count,
        password_last_changed,
        roles!inner (name),
        branches!inner (name)
      `);

    // If specific user IDs provided, filter by them
    if (userIdsParam) {
      const userIds = userIdsParam.split(',').filter((id) => id.trim());
      query = query.in('id', userIds);
    } else {
      // Apply filters
      if (!canExport || userRole !== 'super_admin') {
        // Non-super-admins see only their branch users
        query = query.eq('branch_id', userProfile.branch_id);
      } else if (branch) {
        query = query.eq('branch_id', branch);
      }

      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
      }

      if (role) {
        query = query.eq('role_id', role);
      }

      if (status) {
        const isActive = status.toLowerCase() === 'active' || status === 'true';
        query = query.eq('is_active', isActive);
      }
    }

    const { data: users, error: fetchError } = await query.limit(100000);

    if (fetchError) {
      console.error('Error fetching users for export:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users for export' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found matching criteria' },
        { status: 400 }
      );
    }

    // Log export action
    await adminSupabase.from('audit_log').insert({
      action_type: 'export',
      resource_type: 'users',
      resource_id: 'list',
      user_id_affected: null,
      admin_user_id: currentUser.id,
      description: `Users exported to ${format.toUpperCase()}: ${users.length} records`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // Format data for export
    const exportData = users.map((user) => ({
      'User ID': user.id,
      'Full Name': user.full_name,
      Email: user.email,
      'Phone Number': user.phone_number || '',
      Role: user.roles?.[0]?.name || 'Unknown',
      Branch: user.branches?.[0]?.name || 'Unknown',
      Status: user.is_active ? 'Active' : 'Inactive',
      'Last Login': user.last_login_timestamp || 'Never',
      'Login Count': user.login_count || 0,
      'Password Last Changed': user.password_last_changed || 'Never',
      'Date Created': user.created_at,
    }));

    // Generate appropriate response based on format
    switch (format) {
      case 'csv': {
        const csv = convertToCSV(exportData);
        const bom = '\ufeff'; // UTF-8 BOM for Excel compatibility
        const encodedCsv = bom + csv;

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `users_export_${timestamp}.csv`;

        return new NextResponse(encodedCsv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      case 'excel': {
        // For now, we'll use a library response note
        // In production, you'd use a library like xlsx or ExcelJS
        const csv = convertToCSV(exportData);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `users_export_${timestamp}.xlsx`;

        // TODO: Convert to actual Excel format using xlsx library
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      case 'pdf': {
        // For now, we'll return CSV as fallback
        // In production, you'd use a library like pdfkit or html2pdf
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `users_export_${timestamp}.pdf`;

        // TODO: Convert to actual PDF format with headers, footers, and formatting
        const buffer = convertToPDF(exportData);
        return new Response(buffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('GET /api/users/export error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Convert array of objects to CSV format with proper escaping
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const headerRow = headers.map((h) => escapeCSVField(h)).join(',');

  // Convert rows
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        return escapeCSVField(String(value || ''));
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\n');
}

/**
 * Escape CSV field to handle commas, quotes, newlines
 */
function escapeCSVField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Convert array of objects to PDF format (placeholder)
 * In production, use a library like pdfkit or html2pdf
 */
function convertToPDF(data: any[]): Buffer {
  // This is a placeholder - in production use pdfkit or similar
  // For now, return basic text content
  const content = data
    .map((row) =>
      Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    )
    .join('\n\n---\n\n');

  return Buffer.from(content);
}
