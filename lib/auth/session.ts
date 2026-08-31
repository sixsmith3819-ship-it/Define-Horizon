// lib/auth/session.ts
import { createClient } from './supabase';
import { AuthUser, UserRole } from './types';

export async function getSession(): Promise<AuthUser | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) return null;

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role_id, branch_id, is_active')
    .eq('id', data.session.user.id)
    .single();

  if (!profile) return null;

  // Get role name
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', profile.role_id)
    .single();

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: (role?.name as UserRole) || 'employee',
    branch_id: profile.branch_id,
    is_active: profile.is_active,
  };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
