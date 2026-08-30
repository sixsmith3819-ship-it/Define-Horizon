// lib/auth/permissions.ts
import type { AuthUser, UserRole } from './types';

export function hasPermission(user: AuthUser, permission: string): boolean {
  // For now, super admins have all permissions
  if (user.role === 'super_admin') return true;
  // In production, check against role-based permissions from database
  return false;
}

export function canAccessBranch(user: AuthUser, branchId: string): boolean {
  if (user.role === 'super_admin') return true;
  return user.branch_id === branchId;
}
