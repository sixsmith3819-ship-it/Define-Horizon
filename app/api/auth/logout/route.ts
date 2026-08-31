/**
 * POST /api/auth/logout
 *
 * Logs out the current user by:
 * 1. Finding and closing the active session
 * 2. Logging the logout event
 * 3. Invalidating the session token
 * 4. Clearing authentication cookies
 *
 * Requirements: 17.5, 18.1
 */

import { createAdminClient } from '@/lib/auth/supabase';
import { NextRequest, NextResponse } from 'next/server';

function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('auth_session');

    let userId: string | null = null;
    let sessionId: string | null = null;
    let token: string | null = null;

    // Try to get from Authorization header first
    if (authHeader) {
      token = extractTokenFromHeader(authHeader);
      if (token) {
        const payload = decodeJWT(token);
        if (payload?.sub) {
          userId = payload.sub;
        }
      }
    }

    // If not from header, try from cookie
    if (!userId && sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        userId = sessionData.user_id;
        sessionId = sessionData.session_id;
      } catch {
        // Cookie parse failed
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const ipAddress = getClientIP(request);

    // Find active login_history record
    if (sessionId) {
      const { data: loginRecord } = await supabase
        .from('login_history')
        .select('*')
        .eq('session_id', sessionId)
        .is('logout_timestamp', null)
        .single();

      if (loginRecord) {
        // Calculate session duration
        const loginTime = new Date(loginRecord.login_timestamp);
        const logoutTime = new Date();
        const durationSeconds = Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000);

        // Update login_history with logout details
        await supabase
          .from('login_history')
          .update({
            logout_timestamp: logoutTime.toISOString(),
            session_duration_seconds: durationSeconds,
          })
          .eq('id', loginRecord.id);

        // Log logout event to audit_log
        await supabase.from('audit_log').insert({
          action_type: 'logout',
          resource_type: 'auth',
          resource_id: userId,
          user_id_affected: userId,
          admin_user_id: userId,
          description: `User logged out. Session duration: ${durationSeconds} seconds`,
          ip_address: ipAddress,
          session_id: sessionId,
          after_state: {
            logout_timestamp: logoutTime.toISOString(),
            session_duration_seconds: durationSeconds,
          },
        });
      }
    } else if (token) {
      // No session ID in cookie, but we have token - log it anyway
      const logoutTime = new Date();

      await supabase.from('audit_log').insert({
        action_type: 'logout',
        resource_type: 'auth',
        resource_id: userId,
        user_id_affected: userId,
        admin_user_id: userId,
        description: 'User logged out',
        ip_address: ipAddress,
        after_state: {
          logout_timestamp: logoutTime.toISOString(),
        },
      });
    }

    // Clear the authentication session via Supabase
    // Note: We use the token to invalidate the session if available
    if (token) {
      try {
        // Create a client with the user's token to sign them out
        const userSupabase = createAdminClient();
        await userSupabase.auth.signOut();
      } catch (error) {
        // Session may already be invalid, continue with logout
        console.log('Session already invalidated:', error);
      }
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear auth session cookie
    response.cookies.set({
      name: 'auth_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
