// lib/auth/types.ts
export type UserRole = 'super_admin' | 'branch_manager' | 'employee' | 'auditor';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  branch_id: string | null;
  is_active: boolean;
  full_name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
}
