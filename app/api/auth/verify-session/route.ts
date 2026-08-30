/**
 * POST /api/auth/verify-session
 * 
 * Verifies and optionally refreshes a user session by:
 * 1. Extracting token from request or auth header
 * 2. Validating token with Supabase getUser()
 * 3. Querying profiles table for full user data
 * 4. Loading role and permissions
 * 5. Checking user is_active status
 * 6. Refreshing token if expired and refresh_token provided
 * 7. Returning user profile and tokens
 * 
 * Requirements: 17.4, 17.5, 17.6
 */

import { createAdminClient } from '@/lib/auth/supabase';
import { VerifySessionRequestSchema } from '@/lib/schemas/auth';
import { NextRequest, NextResponse } from 'next/server';

function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function decodeJWT(token: string): { sub?: string; exp?: number; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;

  const expirationTime = payload.exp * 1000; // Convert seconds to milliseconds
  return Date.now() > expirationTime;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = VerifySessionRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or token expired',
        },
        { status: 401 }
      );
    }

    // Get token from request body, authorization header, or cookie
    let token: string | undefined = validation.data.token || undefined;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      token = extractTokenFromHeader(authHeader) || undefined;
    }

    if (!token) {
      const sessionCookie = request.cookies.get('auth_session');
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(sessionCookie.value); token = sessionData.access_token || undefined;
        } catch {
          // Cookie parse failed
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or token expired',
        },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Decode token to get user ID
    const tokenPayload = decodeJWT(token);
    if (!tokenPayload?.sub) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or token expired',
        },
        { status: 401 }
      );
    }

    const userId = tokenPayload.sub;
    let accessToken = token;
    let refreshToken: string | undefined = undefined;
    let refreshed = false;

    // Check if token is expired
    if (isTokenExpired(token)) {
      // Token is expired - try to refresh using refresh_token from body or cookies
      let refreshTokenValue: string | null = null;

      // Look for refresh token in request body first
      if (body.refresh_token) {
        refreshTokenValue = body.refresh_token;
      } else {
        // Try to get from cookies
        const sessionCookie = request.cookies.get('auth_session');
        if (sessionCookie) {
          try {
            const sessionData = JSON.parse(sessionCookie.value);
            refreshTokenValue = sessionData.refresh_token;
          } catch {
            // Cookie parse failed
          }
        }
      }

      if (!refreshTokenValue) {
        // No refresh token available
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required or token expired',
          },
          { status: 401 }
        );
      }

      // Attempt to refresh the session
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshTokenValue,
        });

        if (refreshError || !refreshData.session) {
          return NextResponse.json(
            {
              success: false,
              error: 'Authentication required or token expired',
            },
            { status: 401 }
          );
        }

        accessToken = refreshData.session.access_token;
        refreshToken = refreshData.session.refresh_token;
        refreshed = true;
      } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required or token expired',
          },
          { status: 401 }
        );
      }
    } else {
      refreshToken = token || undefined; // If token is still valid, return it as refresh token
    }

    // Verify user still exists and is active
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        is_active,
        branch_id,
        role_id
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or token expired',
        },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (!profileData.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or token expired',
        },
        { status: 401 }
      );
    }

    // Fetch user role
    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', profileData.role_id)
      .single();

    // Fetch user permissions
    const { data: permissionsData } = await supabase
      .from('role_permissions')
      .select('permission_code')
      .eq('role_id', profileData.role_id);

    const roleName = roleData?.name || 'employee';
    const permissions = (permissionsData || []).map(p => p.permission_code);

    // Determine expires_in (default 1 hour = 3600 seconds)
    const expiresIn = 3600;

    const response = NextResponse.json({
      success: true,
      user: {
        user_id: userId,
        email: profileData.email,
        full_name: profileData.full_name,
        role: roleName,
        branch_id: profileData.branch_id,
        is_active: profileData.is_active,
        permissions,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      refreshed,
    });

    // If token was refreshed, update the cookie
    if (refreshed && refreshToken) {
      response.cookies.set({
        name: 'auth_session',
        value: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          user_id: userId,
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required or token expired',
      },
      { status: 401 }
    );
  }
}
